import time

class Stopwatch:
    __totalElapsed = 0.0
    __start = 0.0

    def start(self):
        self.__start = time.perf_counter()

    def stop(self):
        stop = time.perf_counter()
        self.__totalElapsed += stop - self.__start

    def reset(self):
        self.__totalElapsed = 0.0
        self.__start = 0.0

    @property
    def totalElapsed(self) -> float:
        return self.__totalElapsed

