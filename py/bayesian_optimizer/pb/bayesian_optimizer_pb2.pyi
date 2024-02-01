from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Iterable as _Iterable, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class IntInterval(_message.Message):
    __slots__ = ("lowerBound", "upperBound")
    LOWERBOUND_FIELD_NUMBER: _ClassVar[int]
    UPPERBOUND_FIELD_NUMBER: _ClassVar[int]
    lowerBound: int
    upperBound: int
    def __init__(self, lowerBound: _Optional[int] = ..., upperBound: _Optional[int] = ...) -> None: ...

class BoModelInitData(_message.Message):
    __slots__ = ("possibleXValues", "interval", "kappa", "xi")
    POSSIBLEXVALUES_FIELD_NUMBER: _ClassVar[int]
    INTERVAL_FIELD_NUMBER: _ClassVar[int]
    KAPPA_FIELD_NUMBER: _ClassVar[int]
    XI_FIELD_NUMBER: _ClassVar[int]
    possibleXValues: _containers.RepeatedScalarFieldContainer[int]
    interval: IntInterval
    kappa: float
    xi: float
    def __init__(self, possibleXValues: _Optional[_Iterable[int]] = ..., interval: _Optional[_Union[IntInterval, _Mapping]] = ..., kappa: _Optional[float] = ..., xi: _Optional[float] = ...) -> None: ...

class BoModelId(_message.Message):
    __slots__ = ("modelId",)
    MODELID_FIELD_NUMBER: _ClassVar[int]
    modelId: str
    def __init__(self, modelId: _Optional[str] = ...) -> None: ...

class BoSuggestion(_message.Message):
    __slots__ = ("x", "ei")
    X_FIELD_NUMBER: _ClassVar[int]
    EI_FIELD_NUMBER: _ClassVar[int]
    x: int
    ei: float
    def __init__(self, x: _Optional[int] = ..., ei: _Optional[float] = ...) -> None: ...

class BoObservation(_message.Message):
    __slots__ = ("x", "observation")
    X_FIELD_NUMBER: _ClassVar[int]
    OBSERVATION_FIELD_NUMBER: _ClassVar[int]
    x: int
    observation: float
    def __init__(self, x: _Optional[int] = ..., observation: _Optional[float] = ...) -> None: ...

class GetBoSuggestionRequest(_message.Message):
    __slots__ = ("modelId", "observation")
    MODELID_FIELD_NUMBER: _ClassVar[int]
    OBSERVATION_FIELD_NUMBER: _ClassVar[int]
    modelId: str
    observation: BoObservation
    def __init__(self, modelId: _Optional[str] = ..., observation: _Optional[_Union[BoObservation, _Mapping]] = ...) -> None: ...

class GetBoSuggestionResponse(_message.Message):
    __slots__ = ("modelId", "suggestion")
    MODELID_FIELD_NUMBER: _ClassVar[int]
    SUGGESTION_FIELD_NUMBER: _ClassVar[int]
    modelId: str
    suggestion: BoSuggestion
    def __init__(self, modelId: _Optional[str] = ..., suggestion: _Optional[_Union[BoSuggestion, _Mapping]] = ...) -> None: ...
