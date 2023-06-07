import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ObjectStoreCredentials, ObjectStoreReference } from '../model';
import { ObjectReader, ObjectStoreClient } from '../object-store';
import { S3ObjectReader } from './s3-object-reader';

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

        const objInfo = await this.s3Client.send(command).catch(() => undefined);
        if (!objInfo || typeof objInfo.ContentLength !== 'number') {
            throw new Error(`Could not fetch information about object ${objRef.objectKey}`);
        }

        return new S3ObjectReader(this.s3Client, { objRef, size: objInfo.ContentLength });
    }
}
