from dataclasses import dataclass
from typing import Any, Mapping
from util import check_field_exists_or_error

@dataclass
class ObjectStoreReference:
    url: str
    user: str
    password: str
    bucket: str
    object_key: str
    object_size_bytes: int

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]):
        ObjectStoreReference.validate_dict(data)
        return ObjectStoreReference(
            url=data['url'],
            user=data['user'],
            password=data['password'],
            bucket=data['bucket'],
            object_key=data['objectKey'],
            object_size_bytes=data['objectSizeBytes'],
        )

    @classmethod
    def validate_dict(cls, data: Mapping[str, Any]):
        check_field_exists_or_error(data, 'url', str, ObjectStoreReference)
        check_field_exists_or_error(data, 'user', str, ObjectStoreReference)
        check_field_exists_or_error(data, 'password', str, ObjectStoreReference)
        check_field_exists_or_error(data, 'bucket', str, ObjectStoreReference)
        check_field_exists_or_error(data, 'objectKey', str, ObjectStoreReference)
        check_field_exists_or_error(data, 'objectSizeBytes', int, ObjectStoreReference)
