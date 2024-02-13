from bisect import bisect_left
from typing import Sequence

def is_subsequence(a: Sequence[int], b: Sequence[int]) -> bool:
    """
    Return True if b is a subsequence of a.
    Bot sequences must be sorted.
    """
    if len(b) > len(a):
        return False

    offset_a = bisect_left(a, b[0])
    if offset_a == len(a):
        return False

    for index_b, b_val in enumerate(b):
        index_a = index_b + offset_a
        if a[index_a] != b_val:
            return False

    return True
