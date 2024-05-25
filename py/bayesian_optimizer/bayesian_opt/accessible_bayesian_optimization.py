from bayes_opt import BayesianOptimization
from sklearn.gaussian_process import GaussianProcessRegressor


class AccessibleBayesianOptimization(BayesianOptimization):
    """
    BayesianOptimization subclass that permits external access to the GaussianProcessRegressor
    and other internal information.
    """

    @property
    def gp(self) -> GaussianProcessRegressor:
        return self._gp

    def get_max_y(self) -> float | None:
        """
        Gets the current maximum observed y-value or None if no observations have been recorded yet.
        """
        if len(self._space) > 0:
            return self._space.target.max()
        else:
            return None
