import { Context, HTTPFunction, HealthCheck, IncomingBody, StructuredReturn } from 'faas-js-runtime';
import { isValidObjectStoreReference, ObjectStoreReference } from './object-store';
import { createS3ObjectStoreClient } from './object-store/impl/factories';

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

function createErrorResponse(err: Error): StructuredReturn {
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
    if (!isValidObjectStoreReference(body)) {
        return reportInvalidS3ObjRef();
    }
    console.log('Received request');

    let bytesRead = 0;
    try {
        bytesRead = await readFile(body);
    } catch (err) {
        return createErrorResponse(err);
    }

    return {
        statusCode: 200,
        body: {
            bytesRead: bytesRead,
        },
        headers: {
            'content-type': 'application/json',
        },
    };
};

async function readFile(objRef: ObjectStoreReference): Promise<number> {
    const s3Client = createS3ObjectStoreClient(objRef);
    const reader = await s3Client.createObjectReader(objRef);

    console.log('Created ObjectReader');

    let bytesRead = 0;
    let data: Uint8Array | undefined;
    while ((data = await reader.readBytes(1024 * 1024))) {
        console.log(`Read ${data.length} bytes`);
        bytesRead += data.length;
        console.log(data);
    }
    console.log('Finished reading object.');
    s3Client.destroy();
    return bytesRead;
}

export { handle, liveness, readiness };
