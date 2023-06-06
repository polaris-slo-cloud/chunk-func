import { Context, Function as FaasFunction, IncomingBody, StructuredReturn } from 'faas-js-runtime';
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

const func: FaasFunction = {
    handle: async (context: Context, body?: IncomingBody): Promise<StructuredReturn> => {
        if (!isValidS3ObjectReference(body)) {
            return reportInvalidS3ObjRef();
        }

        const s3Client = new S3ObjectClient(body);
        const reader = s3Client.createObjectReader(body);
        let data: Buffer | undefined;
        while ((data = await reader.readBytes(1024 * 1024))) {
            console.log(data);
        }

        return {
            body: body,
            headers: {
                'content-type': 'application/json',
            },
        };
    },
};

export default func;
