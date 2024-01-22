import boto3
import boto3.session
from .model import ObjectStoreReference

def create_client(obj_ref: ObjectStoreReference):
    return boto3.session.Session().client(
        service_name='s3',
        aws_access_key_id=obj_ref.user,
        aws_secret_access_key=obj_ref.password,
        endpoint_url=obj_ref.url,
        region_name='us-east-1'
    )

def create_resource(obj_ref: ObjectStoreReference):
    return boto3.session.Session().resource(
        service_name='s3',
        aws_access_key_id=obj_ref.user,
        aws_secret_access_key=obj_ref.password,
        endpoint_url=obj_ref.url,
        region_name='us-east-1'
    )

def create_read_url(s3_client, obj_ref: ObjectStoreReference) -> str:
    return s3_client.generate_presigned_url(
        ClientMethod='get_object',
        Params={'Bucket': obj_ref.bucket, "Key": obj_ref.object_key},
        ExpiresIn=10000
    )

def upload_file(s3_resource, filename: str, target_ref: ObjectStoreReference) -> ObjectStoreReference:
    s3_resource.Bucket(target_ref.bucket).upload_file(filename, target_ref.object_key)
    return target_ref
