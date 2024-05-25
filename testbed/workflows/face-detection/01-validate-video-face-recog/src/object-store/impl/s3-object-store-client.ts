import { GetObjectCommand, HeadObjectCommand, HeadObjectCommandOutput, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { ObjectStoreCredentials, ObjectStoreReference } from '../model';
import { ObjectReader, ObjectStoreClient, WritableStream } from '../object-store';
import { S3ObjectReader } from './s3-object-reader';
import { S3ObjectStreamWritable } from './s3-object-stream-writable';

/**
 * A client for an S3 object store.
 */
export class S3ObjectStoreClient implements ObjectStoreClient {
    private s3Client: S3Client | undefined;

    constructor(credentials: ObjectStoreCredentials) {
        this.s3Client = new S3Client({
            credentials: {
                accessKeyId: credentials.user,
                secretAccessKey: credentials.password,
            },
            endpoint: credentials.url,
            region: 'us-east-1',
        });
    }

    destroy(): void {
        if (this.s3Client) {
            this.s3Client.destroy();
            this.s3Client = undefined;
        }
    }

    async createObjectReader(objRef: ObjectStoreReference): Promise<ObjectReader> {
        if (!this.s3Client) {
            throw new Error('This client has already been destroyed.');
        }

        const command = new HeadObjectCommand({
            Bucket: objRef.bucket,
            Key: objRef.objectKey,
        });

        let objInfo: HeadObjectCommandOutput;
        try {
            objInfo = await this.s3Client.send(command);
        } catch (err) {
            const errMsg = JSON.stringify(err, undefined, 4);
            throw new Error(`Could not fetch information about object ${objRef.objectKey}. Internal error: ${errMsg}`);
        }
        if (typeof objInfo.ContentLength !== 'number') {
            throw new Error(`Could not fetch information about object ${objRef.objectKey}. Internal error: no ContentLength`);
        }

        return new S3ObjectReader(this.s3Client, { objRef, size: objInfo.ContentLength });
    }

    createPresignedReadUrl(objRef: ObjectStoreReference): Promise<string> {
        if (!this.s3Client) {
            throw new Error('This client has already been destroyed.');
        }

        const command = new GetObjectCommand({
            Bucket: objRef.bucket,
            Key: objRef.objectKey,
        });

        return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    }

    createObjectWritableStream(objRef: ObjectStoreReference, encoding: BufferEncoding = 'utf8'): Promise<WritableStream> {
        if (!this.s3Client) {
            throw new Error('This client has already been destroyed.');
        }

        return Promise.resolve(new S3ObjectStreamWritable(this.s3Client, objRef, encoding));
    }

    createPresignedWriteUrl(objRef: ObjectStoreReference): Promise<string> {
        if (!this.s3Client) {
            throw new Error('This client has already been destroyed.');
        }

        const command = new PutObjectCommand({
            Bucket: objRef.bucket,
            Key: objRef.objectKey,
        });

        return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    }

    async uploadFile(filePath: string, destObjRef: ObjectStoreReference): Promise<ObjectStoreReference> {
        const fileInfo = fs.statSync(filePath);
        destObjRef.objectSizeBytes = fileInfo.size;

        const readStream = fs.createReadStream(filePath);
        const writeStream = await this.createObjectWritableStream(destObjRef, 'binary');
        await pipeline(readStream, writeStream);
        return destObjRef;
    }
}
