import { Context, HTTPFunction, HealthCheck, IncomingBody, StructuredReturn } from 'faas-js-runtime';
import { S3ObjectClient, isValidS3ObjectReference } from './s3';

function reportInvalidS3ObjRef(): StructuredReturn {
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

const liveness: HealthCheck = () => {
    return {
        status: 200,
        statusMessage: 'OK',
    };
};

const readiness: HealthCheck = () => {
    return {
        status: 200,
        statusMessage: 'OK',
    };
};

const handle: HTTPFunction = async (context: Context, body?: IncomingBody): Promise<StructuredReturn> => {
    if (!isValidS3ObjectReference(body)) {
        return reportInvalidS3ObjRef();
    }

    const s3Client = new S3ObjectClient(body);
    const reader = s3Client.createObjectReader(body);

    let bytesRead = 0;
    let data: Buffer | undefined;
    while ((data = await reader.readBytes(1024 * 1024))) {
        bytesRead += data.length;
        console.log(data);
    }

    return {
        body: {
            bytesRead,
        },
        headers: {
            'content-type': 'application/json',
        },
    };
};

export { handle, liveness, readiness };
