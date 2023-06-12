import { Readable } from 'stream';
import { ObjectStoreReference } from './model';
import { ReadLineByLine } from './read-line-by-line';

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
    readonly size: number;

    /** Gets the current position within the object, i.e., the next byte that will be read. */
    readonly currPos: number;

    /**
     * Seeks to the specified position within the object.
     * If `pos` exceeds `size`, it is automatically set to `size`.
     */
    seekTo(pos: number): void;

    /**
     * Reads the specified number of bytes, starting from the current position, and returns them in a buffer.
     *
     * @returns A buffer with the read bytes or `null` if the end of the object has been reached.
     */
    readBytes(count: number): Promise<Uint8Array | null>;

    /**
     * Creates a `Readable` stream for reading this object.
     *
     * @param encoding (optional) The text encoding to use. Default: none.
     * If an encoding is specified, the stream data will be returned as strings.
     * If no encoding is specified (default), the stream data will be returned as `Buffer` objects.
     */
    getReadableStream(encoding?: BufferEncoding): Readable;

    /**
     * Creates a {@link ReadLineByLine} reader for this object.
     *
     * Since the file is read in buffered chunks in the background, the `currPos` normally does not reflect the end of
     * the last read line.
     *
     * @param encoding The text encoding to be used for reading. Defaults to `utf8` if not set.
     */
    readLineByLine(encoding?: BufferEncoding): ReadLineByLine;

    /**
     * Closes the reader and releases any resources that exclusively belong to the reader.
     */
    close(): void;
}
