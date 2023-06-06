import { S3Client } from '@aws-sdk/client-s3';
import { S3Credentials, S3ObjectReference } from './model';
import { S3ObjectReader, S3ObjectReaderImpl } from './s3-object-reader';

/**
 * A client for an S3 object store.
 */
export class S3ObjectClient {
    private s3Client: S3Client | undefined;

    constructor(credentials: S3Credentials) {
        this.s3Client = new S3Client({
            credentials: {
                accessKeyId: credentials.accessKey,
                secretAccessKey: credentials.secretKey,
            },
            endpoint: credentials.url,
            region: 'us-east-1',
        });
    }

    /**
     * Releases the resources held by this client, e.g., underlying sockets.
     * All readers created from this client cannot be used anymore after destroying the client.
     *
     * Calling this method is optional, but allows releasing resources before
     * the connection to the server times out.
     */
    destroy(): void {
        if (this.s3Client) {
            this.s3Client.destroy();
            this.s3Client = undefined;
        }
    }

    createObjectReader(objRef: S3ObjectReference): S3ObjectReader {
        if (!this.s3Client) {
            throw new Error('This client has already been destroyed.');
        }
        return new S3ObjectReaderImpl(this.s3Client, objRef);
    }
}
