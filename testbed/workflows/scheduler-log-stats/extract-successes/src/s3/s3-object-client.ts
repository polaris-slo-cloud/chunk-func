import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createWriteStream, createReadStream } from 'fs';
import { S3Credentials, S3ObjectReference } from './model';
import { S3ObjectReader, S3ObjectReaderImpl } from './s3-object-reader';


export class S3ObjectClient {
    private s3Client: S3Client;

    constructor(credentials: S3Credentials) {
        this.s3Client = new S3Client({
            credentials: {
                accessKeyId: credentials.accessKey,
                secretAccessKey: credentials.secretKey
            },
            endpoint: credentials.url,
        });
    }

    createObjectReader(objRef: S3ObjectReference): S3ObjectReader {
        return new S3ObjectReaderImpl(this.s3Client, objRef);
    }
}
