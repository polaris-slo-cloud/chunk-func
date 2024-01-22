import { ObjectStoreCredentials } from '../model';
import { ObjectStoreClient } from '../object-store';
import { S3ObjectStoreClient } from './s3-object-store-client';

/**
 * Creates a new ObjectStoreClient for an S3 store.
 */
export function createS3ObjectStoreClient(credentials: ObjectStoreCredentials): ObjectStoreClient {
    return new S3ObjectStoreClient(credentials);
}
