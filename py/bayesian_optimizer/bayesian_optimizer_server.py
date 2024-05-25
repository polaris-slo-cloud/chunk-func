from contextlib import contextmanager
from dataclasses import dataclass
import logging
from threading import Lock
from typing import cast
from uuid import uuid1

from google.protobuf.message import Message as ProtobufMessage

from pb.bayesian_optimizer_pb2 import BoModelId, BoModelInitData, BoSuggestion as PbufBoSuggestion, GetBoSuggestionRequest, GetBoSuggestionResponse, \
    InferYRequest, InferYResponse, ShrinkInputDomainRequest, ShrinkInputDomainResponse
from pb.bayesian_optimizer_pb2_grpc import BayesianOptimizerServiceServicer
from bayesian_opt import IntegerBayesianOptimizer, IntegerInterval

@dataclass
class LockableBayesianOptimizer:
    lock: Lock
    optimizer: IntegerBayesianOptimizer

@dataclass
class ProcessedBoInitData:
    possible_x_values: list[int] | IntegerInterval
    kappa: float | None
    xi: float | None
    max_samples_percent: float

class ModelRefMessage(ProtobufMessage):
    """Helper interface that describes any request with a modelId"""
    def __init__(self):
        self.modelId: str


class BayesianOptimizerServer(BayesianOptimizerServiceServicer):

    def __init__(self):
        self.__optimizers: dict[str, LockableBayesianOptimizer] = {}
        self.__optimizers_lock = Lock()
        self.__nextModelId = 0


    def CreateBoModel(self, request: BoModelInitData, context) -> BoModelId:
        """Creates a new IntegerBayesianOptimizer and stores it in the __optimizers dictionary."""

        modelId = ''
        with self.__optimizers_lock:
            modelId = f'{self.__nextModelId}'
            self.__nextModelId += 1
        init_data = self.__extract_bo_init_data(request)
        logging.info('Creating new BoModel %s for %s', modelId, init_data.possible_x_values)
        optimizer = IntegerBayesianOptimizer(modelId, init_data.possible_x_values, init_data.kappa, init_data.xi, init_data.max_samples_percent)
        lockable = LockableBayesianOptimizer(Lock(), optimizer)

        with self.__optimizers_lock:
            self.__optimizers[modelId] = lockable

        return BoModelId(modelId=modelId)


    def GetBoSuggestion(self, request: GetBoSuggestionRequest, context) -> GetBoSuggestionResponse:
        modelId = self.__extractModelId(request)
        logging.info('GetBoSuggestion for %s', modelId)

        with self.__getLockedOptimizer(modelId) as optimizer:
            if request.HasField('observation'):
                logging.info('Updating %s with observation x=%d, y=%f', modelId, request.observation.x, request.observation.observation)
                optimizer.register_observation(request.observation.x, request.observation.observation)

            suggestion = optimizer.suggest()
            logging.info('Obtained suggestion for %s: x=%d, poi=%f', modelId, suggestion.x, suggestion.poi)
            boSuggestion = PbufBoSuggestion(x=suggestion.x, poi=suggestion.poi, percentageSampled=suggestion.percentage_sampled)
            return GetBoSuggestionResponse(modelId=modelId, suggestion=boSuggestion)


    def InferY(self, request: InferYRequest, context) -> InferYResponse:
        modelId = self.__extractModelId(request)
        logging.info('InferY for %s', modelId)

        with self.__getLockedOptimizer(modelId) as optimizer:
            y = optimizer.infer_y(request.x)
            logging.info("Obtained inference, x=%d, y=%f", request.x, y)
            return InferYResponse(modelId=modelId, x=request.x, y=y)


    def ShrinkInputDomain(self, request: ShrinkInputDomainRequest, context) -> ShrinkInputDomainResponse:
        modelId = self.__extractModelId(request)
        new_input_domain = self.__extract_input_domain_shrink_data(request)
        logging.info('Shrinking input domain for %s, new input domain: %s', modelId, new_input_domain)

        remainingInputDomainSize: int = 0
        with self.__getLockedOptimizer(modelId) as optimizer:
            remainingInputDomainSize = optimizer.shrink_input_domain(new_input_domain)
        return ShrinkInputDomainResponse(modelId=modelId, remainingXValuesCount=remainingInputDomainSize)


    def DeleteBoModel(self, request: BoModelId, context) -> BoModelId:
        modelId = self.__extractModelId(request)
        logging.info('Deleting BoModel %s', modelId)

        with self.__optimizers_lock:
            optimizer = self.__getOptimizer(modelId)
            with optimizer.lock:
                del optimizer.optimizer
                del self.__optimizers[request.modelId]
        return BoModelId(modelId=modelId)


    def __extract_bo_init_data(self, request: BoModelInitData) -> ProcessedBoInitData:
        possible_x_values: list[int] | IntegerInterval
        if len(request.possibleXValues) > 0:
            possible_x_values = list(request.possibleXValues)
        elif request.HasField('interval'):
            possible_x_values = IntegerInterval(lower_bound=request.interval.lowerBound, upper_bound=request.interval.upperBound)
        else:
            raise ValueError('Either possibleXValues or interval must be set.')

        ret = ProcessedBoInitData(
            possible_x_values=possible_x_values,
            kappa=None,
            xi=None,
            max_samples_percent=request.maxSamplesPercent,
        )

        if request.kappa > 0.0:
            ret.kappa = request.kappa
        # The default value of 0.0 is acceptable, so we don't need to check anything for xi.
        ret.xi = request.xi

        return ret


    def __extractModelId(self, request: ProtobufMessage) -> str:
        req = cast(ModelRefMessage, request)
        if not req.modelId:
            raise ValueError('The modelId field must be set')
        return req.modelId


    def __getOptimizer(self, modelId: str) -> LockableBayesianOptimizer:
        optimizer = self.__optimizers.get(modelId)
        if optimizer is None:
            raise ValueError('The BoModel {modelId} does not exist.')
        return optimizer


    @contextmanager
    def __getLockedOptimizer(self, modelId: str):
        self.__optimizers_lock.acquire()
        optimizer: LockableBayesianOptimizer
        try:
            optimizer = self.__getOptimizer(modelId)
            optimizer.lock.acquire()
        finally:
            self.__optimizers_lock.release()

        if optimizer.optimizer is None:
            optimizer.lock.release()
            raise ValueError('The BoModel {modelId} has already been deleted.')

        try:
            yield optimizer.optimizer
        finally:
            optimizer.lock.release()


    def __extract_input_domain_shrink_data(self, request: ShrinkInputDomainRequest) ->  list[int] | IntegerInterval:
        if len(request.possibleXValues) > 0:
            return list(request.possibleXValues)
        elif request.HasField('interval'):
            return IntegerInterval(lower_bound=request.interval.lowerBound, upper_bound=request.interval.upperBound)
        else:
            raise ValueError('Either possibleXValues or interval must be set.')
