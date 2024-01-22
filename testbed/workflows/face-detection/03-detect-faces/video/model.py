from dataclasses import dataclass
from typing import Any, Mapping, Sequence, TypedDict
from util import check_field_exists_or_error
from objstore import ObjectStoreReference

@dataclass
class DetectFacesRequest:
    input: ObjectStoreReference

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]):
        DetectFacesRequest.validate_dict(data)
        obj_store_ref = ObjectStoreReference.from_dict(data['input'])
        return DetectFacesRequest(input=obj_store_ref)

    @classmethod
    def validate_dict(cls, data: Mapping[str, Any]):
        check_field_exists_or_error(data, 'input', dict, DetectFacesRequest)

class DetectFacesSuccessResponse(TypedDict):
    success: bool
    video: str
    width: int
    height: int
    fps: float
    framesWithFaces: int
    output: ObjectStoreReference | None

class Rectangle(TypedDict):
    x: int
    y: int
    width: int
    height: int

class DetectedFacesInFrame(TypedDict):
    frame: int
    """
    Index of the frame.
    """

    faces: Sequence[Rectangle]
    """
    List of faces in the frame
    """

class DetectedFacesInVideo(TypedDict):
    detected: Sequence[DetectedFacesInFrame]
