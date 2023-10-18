import { Readable } from 'node:stream';
import { ObjectReader, ReadableStream } from '../object-store';

/**
 * Extends {@link Readable} for an ObjectStore object.
 */
export class ObjectStreamReadable extends Readable implements ReadableStream {
    // For details on how to implement a Readable see:
    // https://nodejs.org/api/stream.html#implementing-a-readable-stream
    // https://nodejs.org/api/stream.html#an-example-counting-stream

    private abortController: AbortController;

    constructor(private objReader: ObjectReader, encoding?: BufferEncoding) {
        const abortController = new AbortController();
        super({
            encoding: encoding,
            signal: abortController.signal,
            highWaterMark: 1024 * 1024,
        });
        this.abortController = abortController;
    }

    /**
     * Reads the next chunk of data and places it into the buffer through the `push()` method.
     * If EOF is reached, `push()` needs to be called with `null`.
     */
    _read(size: number): void {
        this.objReader
            .readBytes(size)
            .then(data => this.push(data))
            .catch(err => this.destroy(err));
    }

    /**
     * Instructs the Readable to abort the reading process.
     */
    abort(): void {
        this.abortController.abort();
    }
}
