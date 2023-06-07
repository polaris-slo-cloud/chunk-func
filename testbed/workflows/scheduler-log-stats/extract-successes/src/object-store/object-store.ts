import { ObjectStoreReference } from './model';

/**
 * Client for an object store.
 */
export interface ObjectStoreClient {
    /**
     * Releases the resources held by this client, e.g., underlying sockets.
     * All readers created from this client cannot be used anymore after destroying the client.
     *
     * Calling this method is optional, but allows releasing resources before
     * the connection to the server times out.
     */
    destroy(): void;

    /**
     * Creates a reader for the specified object.
     * This will issue a request to retrieve details about the object, but not load any content.
     *
     * @param objRef The ObjectStoreReference that indicates the object to be read.
     */
    createObjectReader(objRef: ObjectStoreReference): Promise<ObjectReader>;
}

/**
 * An abstraction for reading a single object from an object store.
 */
export interface ObjectReader {
    /** Gets the size of the object in bytes. */
    size(): number;

    /**
     * Reads the specified number of bytes, starting from the current position, and returns them in a buffer.
     *
     * @returns A buffer with the read bytes or `undefined` if the end of the object has been reached.
     */
    readBytes(count: number): Promise<Uint8Array | undefined>;
}
