import { StructuredReturn } from 'faas-js-runtime';

export function reportInvalidS3ObjRef(): StructuredReturn {
    return {
        statusCode: 400,
        body: {
            message: 'Incoming body is not a valid S3ObjectReference.',
        },
        headers: {
            'content-type': 'application/json',
        },
    };
}

export function reportInvalidVideoCutRequest(): StructuredReturn {
    return {
        statusCode: 400,
        body: {
            message: 'Incoming body is not a valid VideoCutRequest.',
        },
        headers: {
            'content-type': 'application/json',
        },
    };
}

export function createErrorResponse(err: Error): StructuredReturn {
    return {
        statusCode: 500,
        body: {
            message: err.toString(),
        },
        headers: {
            'content-type': 'application/json',
        },
    };
}
