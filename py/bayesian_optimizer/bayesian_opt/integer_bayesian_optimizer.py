from dataclasses import dataclass
from bisect import bisect_left
import logging
from typing import cast

from bayes_opt import UtilityFunction
import numpy

from .accessible_bayesian_optimization import AccessibleBayesianOptimization
from .input_parameter_domain import InputParameterDomain
from .util import IntegerInterval

# The max number of times we try getting a new suggestion if it always maps to the same bucket.
MAX_SUGGESTION_TRIES = 10

# The positions of the initial samples as a percentage of the input domain.
# These samples are used to bootstrap the BO surrogate model.
INITIAL_SAMPLES = [ 0.1, 0.2, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0 ]

@dataclass
class BoSuggestion:
    x: int
    """The suggested value of the parameter."""

    poi: float
    """The probability of improvement."""

    percentage_sampled: float
    """The percentage of X values that were sampled (not including this one, because there is no Y observation for it yet)."""



class IntegerBayesianOptimizer:
    """
    Bayesian optimizer that operates on a single input parameter X, which can be either an interval of integers
    or a discrete set of integers.

    If the parameter domain is an interval, the suggestion space (the set of possible suggestions is equal to that interval).
    If the parameter domain is a list of discrete values, the suggestion space is the set of indices of that list.
    However, all public methods use the parameter domain.
    """

    def __init__(self, modelId: str, possible_x_values: list[int] | IntegerInterval, kappa: float | None, xi: float | None, max_samples_percent: float | None):
        self.__modelId = modelId
        self.__input_domain = InputParameterDomain(possible_x_values)
        bounds = self.__input_domain.get_gp_bounds()

        self.__bootstrap_suggestions = self.__compute_bootstrap_suggestions()
        """These X values are returned as the initial suggestions to bootstrap the BO surrogate model."""

        self.__observed_values: dict[int, float] = {}
        """
        Since BO suggests floating point values for X, we might get multiple suggestions that map to the same integer X'.
        If we already have an observed value for the integer X', we register that value for the suggested float X.
        """

        if max_samples_percent is None or max_samples_percent == 0.0:
            max_samples_percent = 1.0
        if max_samples_percent < 0.0 or max_samples_percent > 1.0:
            raise ValueError(f'Invalid maxSamplesPercent: {max_samples_percent}. Value must be in the range [0.0, 1.0].')
        self.__max_samples_percent = max_samples_percent

        if kappa is None:
            kappa = 2.576
        if xi is None:
            xi = 0.01

        self.__optimizer = self.__create_bo_model(bounds)

        self.__eiFn = UtilityFunction(kind='ei', kappa=kappa, xi=xi) # type: ignore (TypeHint for xi is wrong, it should be a float)
        """We use expected improvement to determine the next suggestion by the BO."""

        self.__poiFn = UtilityFunction(kind='poi', kappa=kappa, xi=xi) # type: ignore (TypeHint for xi is wrong, it should be a float)
        """The probability of improvement is only used for the BoSuggestion returned as a result."""


    def suggest(self) -> BoSuggestion:
        """
        Makes a new suggestion for X and also returns its expected improvement.
        """
        remaining_input_domain_size = self.__input_domain.get_unused_values_count()
        percentage_sampled = self.__get_percentage_sampled()
        if remaining_input_domain_size == 0 or percentage_sampled > self.__max_samples_percent:
            return BoSuggestion(x=0, poi=0.0, percentage_sampled=percentage_sampled)

        if len(self.__bootstrap_suggestions) > 0:
            return self.__get_bootstrap_suggestion()

        x_suggestion = self.__compute_new_suggestion()
        poi = 1.0

        max_y = self.__optimizer.get_max_y()
        if max_y is not None:
            x = numpy.array([ [x_suggestion] ], numpy.float64)
            utility_poi = self.__poiFn.utility(x, self.__optimizer.gp, self.__optimizer.get_max_y())
            if utility_poi is None:
                raise AssertionError('Could not compute EI')
            poi = utility_poi.max()

        return BoSuggestion(x=x_suggestion, poi=poi, percentage_sampled=percentage_sampled)


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
        self.__optimizer = self.__create_bo_model(bounds_float)
        self.__replay_observed_values_to_bo_and_prune(lower_bound=lower_x, upper_bound=upper_x)
        return self.__input_domain.get_unused_values_count()


    def __compute_bootstrap_suggestions(self) -> list[int]:
        ret: list[int] = []
        if self.__input_domain.size < len(INITIAL_SAMPLES):
            return ret
        highest_index = self.__input_domain.size - 1

        # We want the list to go from highest to lowest value to avoid
        # having to check for input domain shrinking when getting a bootstrap suggestion.
        for percentage in reversed(INITIAL_SAMPLES):
            index = int(highest_index * percentage)
            ret.append(self.__input_domain[index])

        return ret


    def __create_bo_model(self, bounds: tuple[float, float]) -> AccessibleBayesianOptimization:
        bo = AccessibleBayesianOptimization(
            f=None,
            pbounds={ 'x': bounds },
            verbose=2,
            random_state=1,
            allow_duplicate_points=True, # Workaround for BO sometimes suggesting an already observed point: https://github.com/bayesian-optimization/BayesianOptimization/issues/158
        )
        bo.set_gp_params(alpha=1e-3)
        return bo


    def __get_bootstrap_suggestion(self) -> BoSuggestion:
        x = self.__bootstrap_suggestions.pop()
        percentage_sampled = self.__get_percentage_sampled()
        return BoSuggestion(x=x, poi=1.0, percentage_sampled=percentage_sampled)


    def __compute_new_suggestion(self) -> int:
        suggestion = self.__optimizer.suggest(self.__eiFn)
        x_int = self.__input_domain.map_gp_x_to_input_domain(suggestion['x'])
        observed = self.__observed_values.get(x_int)
        tries = 1

        # If the corresponding x_int has already been observed, register that observation for the suggested x_float
        # and try getting a new suggestion for at most MAX_SUGGESTION_TRIES attempts.
        while observed is not None and tries <= MAX_SUGGESTION_TRIES:
            logging.info('BO %s: Suggested float %f maps to already observed x=%d, registering y=%f', self.__modelId, suggestion['x'], x_int, observed)
            self.__optimizer.register(params=suggestion, target=observed)

            suggestion = self.__optimizer.suggest(self.__eiFn)
            x_int = self.__input_domain.map_gp_x_to_input_domain(suggestion['x'])
            observed = self.__observed_values.get(x_int)
            tries += 1

        # If all suggestions mapped to an existing x_int, the GP likely got stuck in that bucket,
        # so we pick a random unused value.
        if observed is not None:
            x_int = self.__input_domain.pick_random_value()
            logging.info('BO %s: Suggestion mapped to a used value %d times. Got random, unused X: %d', self.__modelId, MAX_SUGGESTION_TRIES, x_int)

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
            if x >= lower_bound and x <= upper_bound:
                self.__register_observation__without_marking_used(x, y)
            else:
                logging.warning('BO %s: Pruning valid observation for X=%d, while shrinking input domain to [%d, %d].', self.__modelId, x, lower_bound, upper_bound)


    def __get_percentage_sampled(self) -> float:
        """
        Returns the percentage of X-values that have already been sampled.
        This includes only values, for which a Y-value has been observed.
        """
        remaining_input_domain_size = self.__input_domain.get_unused_values_count()
        percentage_sampled = 1.0 - float(remaining_input_domain_size) / float(self.__input_domain.size)
        return percentage_sampled
