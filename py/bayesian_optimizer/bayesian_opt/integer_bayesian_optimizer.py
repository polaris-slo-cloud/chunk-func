from dataclasses import dataclass
from bisect import bisect_left
import logging
from typing import cast

from bayes_opt import UtilityFunction
import numpy

from .accessible_bayesian_optimization import AccessibleBayesianOptimization
from .input_parameter_domain import InputParameterDomain
from .util import IntegerInterval, is_subsequence


@dataclass
class BoSuggestion:
    x: int
    """The suggested value of the parameter."""

    poi: float
    """The probability of improvement."""



class IntegerBayesianOptimizer:
    """
    Bayesian optimizer that operates on a single input parameter X, which can be either an interval of integers
    or a discrete set of integers.

    If the parameter domain is an interval, the suggestion space (the set of possible suggestions is equal to that interval).
    If the parameter domain is a list of discrete values, the suggestion space is the set of indices of that list.
    However, all public methods use the parameter domain.
    """

    def __init__(self, modelId: str, possible_x_values: list[int] | IntegerInterval, kappa: float | None, xi: float | None):
        self.__modelId = modelId
        self.__input_domain = InputParameterDomain(possible_x_values)
        bounds = self.__input_domain.get_gp_bounds()

        self.__observed_values: dict[int, float] = {}
        """
        Since BO suggests floating point values for X, we might get multiple suggestions that map to the same integer X'.
        If we already have an observed value for the integer X', we register that value for the suggested float X.
        """

        if kappa is None:
            kappa = 2.576
        if xi is None:
            xi = 0.0

        self.__optimizer = self.__createBOModel(bounds)

        self.__eiFn = UtilityFunction(kind='ei', kappa=kappa, xi=xi) # type: ignore (TypeHint for xi is wrong, it should be a float)
        """We use expected improvement to determine the next suggestion by the BO."""

        self.__poiFn = UtilityFunction(kind='poi', kappa=kappa, xi=xi) # type: ignore (TypeHint for xi is wrong, it should be a float)
        """The probability of improvement is only used for the BoSuggestion returned as a result."""


    def suggest(self) -> BoSuggestion:
        """
        Makes a new suggestion for X and also returns its expected improvement.
        """
        remaining_input_domain_size = self.__input_domain.get_unused_values_count()
        if remaining_input_domain_size == 0:
            return BoSuggestion(x=-1, poi=0.0)

        x_suggestion = self.__compute_new_suggestion()
        poi = 1.0

        if remaining_input_domain_size > 1:
            max_y = self.__optimizer.get_max_y()
            if max_y is not None:
                x = numpy.array([ [x_suggestion] ], numpy.float64)
                utility_poi = self.__poiFn.utility(x, self.__optimizer.gp, self.__optimizer.get_max_y())
                if utility_poi is None:
                    raise AssertionError('Could not compute EI')
                poi = utility_poi.max()
        else:
            # If only 1 value was left from the input domain, it is exhausted now.
            poi = 0.0

        return BoSuggestion(x=x_suggestion, poi=poi)


    def register_observation(self, x: int, observation: float) -> None:
        """
        Registers an observation for a specific X and marks it as used in the input domain.
        """
        self.__register_observation__without_marking_used(x=x, observation=observation)
        self.__input_domain.mark_value_used(x)


    def infer_y(self, x: int) -> float:
        """
        Infers Y at the coordinate X.
        """
        x_float = self.__input_domain.map_value_to_gp_space(x)
        y = cast(numpy.ndarray, self.__optimizer.gp.predict(numpy.array([ [x_float] ], numpy.float64)))
        return y[0]

    def shrink_input_domain(self, possible_x_values: list[int] | IntegerInterval) -> int:
        """
        Shrinks the input domain by creating a new GP with the input domain and replaying all
        previously observed values in that range.
        Returns the number of remaining values in the input domain, for which nothing has been observed yet.
        """
        lower_x, upper_x = self.__input_domain.shrink_input_domain(possible_x_values)
        bounds_float = self.__input_domain.get_gp_bounds()
        self.__optimizer = self.__createBOModel(bounds_float)
        self.__replay_observed_values_to_bo_and_prune(lower_bound=lower_x, upper_bound=upper_x)
        return self.__input_domain.get_unused_values_count()


    def __createBOModel(self, bounds: tuple[float, float]) -> AccessibleBayesianOptimization:
        bo = AccessibleBayesianOptimization(
            f=None,
            pbounds={ 'x': bounds },
            verbose=2,
            random_state=1,
        )
        bo.set_gp_params(alpha=1e-3)
        return bo


    def __compute_new_suggestion(self) -> int:
        suggestion = self.__optimizer.suggest(self.__eiFn)
        x_int = self.__input_domain.map_gp_x_to_input_domain(suggestion['x'])
        observed = self.__observed_values.get(x_int)

        while observed is not None:
            logging.info('BO %s: Suggested float %f maps to already observed x=%d, registering y=%f', self.__modelId, suggestion['x'], x_int, observed)
            self.__optimizer.register(params=suggestion, target=observed)

            suggestion = self.__optimizer.suggest(self.__eiFn)
            x_int = self.__input_domain.map_gp_x_to_input_domain(suggestion['x'])
            observed = self.__observed_values.get(x_int)

        # We intentionally do not mark x_int as used in the input_domain - we do that
        # when an observation is registered.
        return x_int


    def __register_observation__without_marking_used(self, x: int, observation: float) -> None:
        """
        Registers an observation for a specific X without marking it as used.
        """
        params = { 'x': self.__input_domain.map_value_to_gp_space(x) }
        self.__optimizer.register(params=params, target=observation)
        self.__observed_values[x] = observation


    def __replay_observed_values_to_bo_and_prune(self, lower_bound: int, upper_bound: int):
        """
        Replays all observed values within the shrunk input domain to the optimizer and prunes values that are no longer in that domain.
        """
        old_observed = self.__observed_values
        self.__observed_values = {}
        for x, y in old_observed.items():
            if x >= lower_bound or x <= upper_bound:
                self.__register_observation__without_marking_used(x, y)
