from dataclasses import dataclass
from bisect import bisect_left
import logging
from typing import cast, TypedDict

from bayes_opt import UtilityFunction
import numpy

from .accessible_bayesian_optimization import AccessibleBayesianOptimization
from .util import is_subsequence

class IntegerInterval(TypedDict):
    """
    Defines an inclusive integer interval.
    """
    lower_bound: int
    upper_bound: int


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
        # After __init__ either __possible_x_values or __xInterval has to be set.
        self.__possible_x_values: list[int] | None = None
        self.__xInterval: IntegerInterval | None = None
        bounds = self.__determineInputBounds(possible_x_values)

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
        remaining_input_domain_size = self.__remaining_input_domain_size()
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
        Registers an observation for a specific X.
        """
        params = { 'x': self.__param_domain_to_suggestion_space(x) }
        self.__optimizer.register(params=params, target=observation)
        self.__observed_values[x] = observation


    def infer_y(self, x: int) -> float:
        """
        Infers Y at the coordinate X.
        """
        x_float = self.__param_domain_to_suggestion_space(x)
        y = cast(numpy.ndarray, self.__optimizer.gp.predict(numpy.array([ [x_float] ], numpy.float64)))
        return y[0]

    def shrink_input_domain(self, possible_x_values: list[int] | IntegerInterval) -> int:
        """
        Shrinks the input domain by creating a new GP with the input domain and replaying all
        previously observed values in that range.
        Returns the number of remaining values in the input domain, for which nothing has been observed yet.
        """
        lower_x, upper_x = self.__validate_shrunk_input_domain(possible_x_values)
        bounds_float = self.__determineInputBounds(possible_x_values)
        self.__optimizer = self.__createBOModel(bounds_float)
        self.__replay_observed_values_to_bo_and_prune(lower_bound=lower_x, upper_bound=upper_x)
        return self.__remaining_input_domain_size()

    def __determineInputBounds(self, possible_x_values: list[int] | IntegerInterval) -> tuple[float, float]:
        if type(possible_x_values) is list:
            possible_x_values.sort()
            self.__possible_x_values = possible_x_values
            return (0.0, float(len(possible_x_values) - 1))
        else:
            self.__xInterval = cast(IntegerInterval, possible_x_values)
            return (float(self.__xInterval['lower_bound']), float(self.__xInterval['upper_bound']))


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
        x_int = self.__suggestion_space_to_param_domain(suggestion['x'])
        observed = self.__observed_values.get(x_int)

        while observed is not None:
            logging.info('BO %s: Suggested float %f maps to already observed x=%d, registering y=%f', self.__modelId, suggestion['x'], x_int, observed)
            self.__optimizer.register(params=suggestion, target=observed)

            suggestion = self.__optimizer.suggest(self.__eiFn)
            x_int = self.__suggestion_space_to_param_domain(suggestion['x'])
            observed = self.__observed_values.get(x_int)

        return x_int


    def __remaining_input_domain_size(self) -> int:
        input_domain_size: int

        if self.__xInterval is not None:
            input_domain_size = self.__xInterval['upper_bound'] - self.__xInterval['lower_bound'] + 1
        else:
            possible_x_values = cast(list[int], self.__possible_x_values)
            input_domain_size = len(possible_x_values)

        return input_domain_size - len(self.__observed_values)


    def __suggestion_space_to_param_domain(self, suggestion: float) -> int:
        """
        Maps a suggestion value from the suggestion space to the parameter domain.
        """
        int_suggestion = round(suggestion)
        if self.__xInterval is not None:
            return int_suggestion
        else:
            return self.__possible_x_values[int_suggestion] # type: ignore


    def __param_domain_to_suggestion_space(self, x: int) -> float:
        """
        Maps a value from the parameter domain to the suggestion space.
        """
        if self.__xInterval is not None:
            return float(x)
        else:
            possible_x_values = cast(list[int], self.__possible_x_values)
            index = bisect_left(possible_x_values, x)
            if index != len(possible_x_values) and possible_x_values[index] == x:
                return float(index)
            raise ValueError(f'Could not find the parameter {x}')


    def __validate_shrunk_input_domain(self, possible_x_values: list[int] | IntegerInterval) -> tuple[int, int]:
        """
        Ensures that the shrunk input domain is valid and raises an error, if this is not the case.
        If the domain is valid, its lower and upper bound (both inclusive) are returned.
        """
        if type(possible_x_values) is list:
            if self.__possible_x_values is None:
                raise ValueError('Original input domain was specified as interval. Cannot specify shrunk input domain as set of discrete values.')
            possible_x_values.sort()
            if len(possible_x_values) > len(self.__possible_x_values) or possible_x_values[0] < self.__possible_x_values[0] or possible_x_values[-1] > self.__possible_x_values[-1]:
                raise ValueError('The shrunk list of possible x values must be smaller than the original one.')
            if not is_subsequence(self.__possible_x_values, possible_x_values):
                raise ValueError('The shrunk list of possible x values must be a continuous subsequence of the original set.')
            return possible_x_values[0], possible_x_values[-1]
        else:
            if self.__xInterval is None:
                raise ValueError('Original input domain was specified as set of discrete values. Cannot specify shrunk input domain as interval.')
            new_interval = cast(IntegerInterval, possible_x_values)
            if new_interval['lower_bound'] < self.__xInterval['lower_bound'] or new_interval['upper_bound'] > self.__xInterval['upper_bound']:
                raise ValueError('The shrunk interval must be smaller than the original one.')
            return new_interval['lower_bound'], new_interval['upper_bound']


    def __replay_observed_values_to_bo_and_prune(self, lower_bound: int, upper_bound: int):
        """
        Replays all observed values within the shrunk input domain to the optimizer and prunes values that are no longer in that domain.
        """
        old_observed = self.__observed_values
        self.__observed_values = {}
        for x, y in old_observed.items():
            if x >= lower_bound or x <= upper_bound:
                self.register_observation(x, y)
