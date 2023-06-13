import { Context, HTTPFunction, HealthCheck, IncomingBody, StructuredReturn } from 'faas-js-runtime';
import { randomUUID } from 'node:crypto';
import { isValidObjectStoreReference, ObjectReader, ObjectStoreReference } from './object-store';
import { createS3ObjectStoreClient } from './object-store/impl/factories';
import { LineByLineTransformer } from './object-store/transformer';

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

    // let bytesRead = 0;
    // try {
    //     bytesRead = await readFileLineByLine(body);
    // } catch (err) {
    //     return createErrorResponse(err as Error);
    // }

    let outFile: ObjectStoreReference;
    try {
        outFile = await transformFile(body);
    } catch (err) {
        return createErrorResponse(err as Error);
    }

    return {
        statusCode: 200,
        body: {
            outFile: outFile.objectKey,
        },
        headers: {
            'content-type': 'application/json',
        },
    };
};

async function transformFile(objRef: ObjectStoreReference): Promise<ObjectStoreReference> {
    const targetFileName = randomUUID();
    const targetObjRef: ObjectStoreReference = {
        ...objRef,
        objectKey: `${targetFileName}.log`,
    };
    const s3Client = createS3ObjectStoreClient(objRef);
    const reader = await s3Client.createObjectReader(objRef);
    const writer = await s3Client.createObjectWritableStream(targetObjRef, 'utf-8');
    const lineByLineReader = reader.readLineByLine('utf-8');

    const transformer = new LineByLineTransformer({
        input: lineByLineReader,
        output: writer,
        transformLine: line => {
            if (line.indexOf('SchedulingSuccess') !== -1) {
                return line;
            }
            return undefined;
        },
    });

    await transformer.start();
    return targetObjRef;
}

async function readFileLineByLine(objRef: ObjectStoreReference): Promise<number> {
    const s3Client = createS3ObjectStoreClient(objRef);
    const reader = await s3Client.createObjectReader(objRef);
    console.log('Created ObjectReader');

    try {
        return await readLineByLineInternal(reader);
    } finally {
        s3Client.destroy();
    }
}

function readLineByLineInternal(reader: ObjectReader): Promise<number> {
    return new Promise((resolve, reject) => {
        let linesRead = 0;
        const rl = reader.readLineByLine();
        rl.onLineRead(line => {
            console.log(line);
            ++linesRead;
            return true;
        });
        rl.onError(err => reject(err));
        rl.onEnd(() => {
            console.log('Finished reading object.');
            resolve(linesRead);
        });
    });
}

async function readFile(objRef: ObjectStoreReference): Promise<number> {
    const s3Client = createS3ObjectStoreClient(objRef);
    const reader = await s3Client.createObjectReader(objRef);

    console.log('Created ObjectReader');

    let bytesRead = 0;
    let data: Uint8Array | null;
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
