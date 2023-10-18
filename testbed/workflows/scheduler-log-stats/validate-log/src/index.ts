import { Context, HTTPFunction, HealthCheck, IncomingBody, StructuredReturn } from 'faas-js-runtime';
import { isValidObjectStoreReference, ObjectReader, ObjectStoreReference } from './object-store';
import { createS3ObjectStoreClient } from './object-store/impl/factories';
import { createErrorResponse, reportInvalidS3ObjRef } from './util';

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
    const start = new Date();
    if (!isValidObjectStoreReference(body)) {
        return reportInvalidS3ObjRef();
    }
    console.log('Received request');

    try {
        await validateLog(body);
    } catch (err) {
        return createErrorResponse(err as Error);
    }

    const end = new Date();
    const durationMs = end.valueOf() - start.valueOf();
    console.log('Request completed in (ms):', durationMs);

    return {
        statusCode: 200,
        body: {
            validationSuccess: true,
            file: body,
            durationMs: durationMs,
        },
        headers: {
            'content-type': 'application/json',
        },
    };
};

async function validateLog(objRef: ObjectStoreReference): Promise<void> {
    const s3Client = createS3ObjectStoreClient(objRef);
    const reader = await s3Client.createObjectReader(objRef);
    return validateLogInternal(reader);
}

function validateLogInternal(reader: ObjectReader): Promise<void> {
    return new Promise((resolve, reject) => {
        const rl = reader.readLineByLine();

        rl.onLineRead(line => {
            // This is a dummy function. We just stream the log.
            return true;
        });

        rl.onError(err => reject(err));

        rl.onEnd(() => {
            console.log('Finished reading object.');
            resolve();
        });
    });
}

export { handle, liveness, readiness };
