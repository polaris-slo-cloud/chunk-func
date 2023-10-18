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

export function reportInvalidVideoRequest(reqType: string): StructuredReturn {
    return {
        statusCode: 400,
        body: {
            message: `Incoming body is not a valid ${reqType}.`,
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
