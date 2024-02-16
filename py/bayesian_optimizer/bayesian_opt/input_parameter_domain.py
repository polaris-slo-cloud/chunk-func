from bisect import bisect_left
from random import randint
from typing import cast

from .util import IntegerInterval, is_subsequence

class InputParameterDomain:
    """
    Represents the domain of the input parameter X for a Bayesian Optimization and
    can be used to managed the remaining values from the domain that have not been used yet.

    We use bucketing to map the floating point X-coordinate of BO to the integer values
    of the input parameter domain.
    """

    def __init__(self, possible_values: list[int] | IntegerInterval):
        self.__all_values: list[int] = self.__create_all_values_list(possible_values)
        """A sorted list of all values (the buckets) of the input domain."""

        self.__last_unused_value_index = len(self.__all_values) - 1
        self.__unused_values: list[int]
        """
        The list of unused values in an arbitrary order.
        __last_unused_value_index is the index of the last value in the list that has not bee used yet.
        When a value is marked as used, it is swapped with the last unused value, the
        __last_unused_value_index is decremented, and the indices of the two values in
        __value_indices are updated.
        """

        self.__value_indices: dict[int, int]
        """Maps each value from the input domain to its index in the unused_values list."""

        self.__set_up_unused_values()


    def mark_value_used(self, used_value: int):
        """
        Marks the specified value as used.
        """
        if not self.__try_mark_value_used(used_value):
            raise ValueError(f'The value {used_value} has already been used.')


    def pick_random_value(self) -> int:
        """
        Returns a random, unused value and marks it as used.
        """
        index = randint(0, self.__last_unused_value_index)
        value = self.__unused_values[index]
        self.mark_value_used(value)
        return value


    def map_gp_x_to_input_domain(self, x_float: float) -> int:
        """
        Converts a zero-based X coordinate from the Gaussian Process into a value from
        the input parameter domain.
        """
        index = round(x_float)
        return self.__all_values[index]


    def map_value_to_gp_space(self, value: int) -> float:
        """
        Maps a value from the input parameter domain to the X-axis of the Gaussian Process.
        """
        index = bisect_left(self.__all_values, value)
        if index != len(self.__all_values) and self.__all_values[index] == value:
            return float(index)
        raise ValueError(f'Could not find the parameter {value}')


    def get_unused_values_count(self) -> int:
        """
        Returns the number of unused values.
        """
        return self.__last_unused_value_index + 1


    def get_gp_bounds(self) -> tuple[float, float]:
        """
        Returns the lower and the upper bound to be used for creating the Gaussian Process.
        The lower bound is always zero.
        """
        return 0.0, float(len(self.__all_values) - 1)


    def shrink_input_domain(self, possible_x_values: list[int] | IntegerInterval) -> tuple[int, int]:
        """
        Shrinks the input domain and returns the new lowest value and the new highest value.
        Raises an exception is the new input domain would not be valid.
        """
        new_all_values = self.__create_all_values_list(possible_x_values)
        new_smallest = new_all_values[0]
        new_largest = new_all_values[-1]
        if len(new_all_values) > len(self.__all_values) or new_smallest < self.__all_values[0] or new_largest > self.__all_values[-1]:
                raise ValueError('The shrunk list of possible x values must be smaller than the original one.')
        if not is_subsequence(self.__all_values, new_all_values):
            raise ValueError('The shrunk list of possible x values must be a continuous subsequence of the original set.')

        for value in self.__all_values:
            if value < new_smallest:
                self.__try_mark_value_used(value)
            else:
                break
        for value in reversed(self.__all_values):
            if value > new_largest:
                self.__try_mark_value_used(value)
            else:
                break

        self.__all_values = new_all_values
        return new_smallest, new_largest


    def __create_all_values_list(self, possible_values: list[int] | IntegerInterval) -> list[int]:
        if type(possible_values) is list:
            possible_values.sort()
            return possible_values
        else:
            interval = cast(IntegerInterval, possible_values)
            ret: list[int] = []
            for i in range(interval['lower_bound'], interval['upper_bound'] + 1):
                ret.append(i)
            return ret


    def __set_up_unused_values(self):
        self.__unused_values = []
        self.__value_indices = {}
        for i, value in enumerate(self.__all_values):
            self.__unused_values.append(value)
            self.__value_indices[value] = i


    def __try_mark_value_used(self, used_value: int) -> bool:
        """
        Marks the specified value as used.
        Returns True if the value was previously unused, otherwise False.
        """
        val_index = self.__value_indices[used_value]
        if val_index > self.__last_unused_value_index:
            return False
        unused_value = self.__unused_values[self.__last_unused_value_index]

        self.__unused_values[val_index] = unused_value
        self.__unused_values[self.__last_unused_value_index] = used_value

        self.__value_indices[unused_value] = val_index
        self.__value_indices[used_value] = self.__last_unused_value_index
        self.__last_unused_value_index -= 1
        return True
