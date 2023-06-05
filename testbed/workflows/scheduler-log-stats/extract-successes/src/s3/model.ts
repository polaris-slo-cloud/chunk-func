import { IncomingBody } from 'faas-js-runtime';

export interface S3Credentials {
    url: string;
    accessKey: string;
    secretKey: string;
}

export interface S3ObjectReference extends S3Credentials {
    bucket: string;
    objectKey: string;
}

export function isValidS3ObjectReference(obj: IncomingBody | undefined): obj is S3ObjectReference {
    const objRef = obj as S3ObjectReference;
    let isValid = typeof objRef.url === 'string';
    isValid = isValid && typeof objRef.accessKey === 'string';
    isValid = isValid && typeof objRef.secretKey === 'string';
    isValid = isValid && typeof objRef.bucket === 'string';
    isValid = isValid && typeof objRef.objectKey === 'string';
    return isValid;
}
