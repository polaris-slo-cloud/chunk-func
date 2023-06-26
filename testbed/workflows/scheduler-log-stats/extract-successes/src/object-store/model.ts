import { IncomingBody } from 'faas-js-runtime';

export interface ObjectStoreCredentials {
    url: string;
    user: string;
    password: string;
}

export interface ObjectStoreReference extends ObjectStoreCredentials {
    bucket: string;
    objectKey: string;
}

export function isValidObjectStoreReference(obj: IncomingBody | undefined): obj is ObjectStoreReference {
    const objRef = obj as ObjectStoreReference;
    let isValid = typeof objRef.url === 'string';
    isValid = isValid && typeof objRef.user === 'string';
    isValid = isValid && typeof objRef.password === 'string';
    isValid = isValid && typeof objRef.bucket === 'string';
    isValid = isValid && typeof objRef.objectKey === 'string';
    return isValid;
}
