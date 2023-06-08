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
     * Reads the object line by line and calls the `onLineRead` callback for each line.
     *
     * Since the file is read in buffered chunks in the background, the `currPos` normally does not reflect the end of
     * the last read line.
     */
    readLineByLine(options: ReadLineByLineOptions): void;

    /**
     * Closes the reader and releases any resources that exclusively belong to the reader.
     */
    close(): void;
}

/**
 * Configuration object for the `readLineByLine()` method of {@link ObjectReader}.
 */
export interface ReadLineByLineOptions {
    /**
     * The callback function called for every line that is read. The callback must return
     * `true` to proceed the reading process or `false` to abort it.
     */
    onLineRead: (line: string) => boolean;

    /**
     * Called when the end of the object has been reached.
     */
    onEnd?: () => void;

    /**
     * Called when an error occurs.
     */
    onError?: (err: Error) => void;

    /**
     * The text encoding of the object.
     * If not set, this defaults to `'utf8'`.
     */
    encoding?: BufferEncoding;
}
