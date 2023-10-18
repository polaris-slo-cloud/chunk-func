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

    /**
     * Creates a {@link WritableStream} for a new or existing object.
     *
     * @param objRef The ObjectStoreReference that indicates the object to be created/overwritten.
     * @param encoding (optional) The encoding to use when writing a string. Default: `utf8`.
     * This has no effect on writing `Buffer` or `Uint8Array` objects.
     */
    createObjectWritableStream(objRef: ObjectStoreReference, encoding?: BufferEncoding): Promise<WritableStream>;
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
    getReadableStream(encoding?: BufferEncoding): ReadableStream;

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

/**
 * A readable stream for an object in an object store.
 */
export interface ReadableStream extends NodeJS.ReadableStream {
    /**
     * Instructs the stream to abort any asynchronous read operation that is currently in progress.
     */
    abort(): void;
}

/**
 * A writable stream for creating or overwriting an object in an object store.
 */
export interface WritableStream extends NodeJS.WritableStream {
    /**
     * @returns A promise that resolves when the stream is ready for writing (i.e., the internal buffer has been drained).
     */
    readyToWrite(): Promise<void>;

    /**
     * Writes any remaining data in the buffer and closes the stream.
     *
     * @returns A promise that resolves when the stream has been successfully closed.
     */
    end$(): Promise<void>;
}
