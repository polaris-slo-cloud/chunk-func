from dataclasses import dataclass
from util import check_field_exists_or_error
from objstore import ObjectStoreReference

@dataclass
class DetectFacesRequest:
    input: ObjectStoreReference

    @classmethod
    def from_dict(cls, data: dict[str, any]):
        obj_store_ref = ObjectStoreReference.from_dict(data['input'])
        return DetectFacesRequest(input=obj_store_ref)

    @classmethod
    def validate_dict(cls, data: dict[str, any]):
        check_field_exists_or_error(data, 'input', dict[str, any], DetectFacesRequest)
