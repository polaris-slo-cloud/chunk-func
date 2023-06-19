import { S3Client } from '@aws-sdk/client-s3';
import { ObjectStoreReference } from '../model';
import { WritableStream } from '../object-store';
import { UnbufferedS3ObjectStreamWritable, s3MinMultiPartSize } from './unbuffered-s3-object-stream-writable';

export type WriteCallback = (error: Error | null | undefined) => void;

/**
 * Implements a WritableStream for an S3 object.
 *
 * For simplicity this class will throw an error if a write() is attempted before the drain event when
 * the previous write() has returned false.
 *
 * write() will also throw an error if the chunk exceeds {@link maxChunkSize}.
 *
 * end() must only be called after writes have finished (i.e., the stream is drained/readyToWrite).
 */
export class S3ObjectStreamWritable extends UnbufferedS3ObjectStreamWritable implements WritableStream {
    /**
     * The size of the internal buffer.
     * (same as the minimum single multi-part upload size = 5 MB)
     */
    static readonly bufferSize = s3MinMultiPartSize;

    /**
     * The maximum size of the chunks that can be passed to write().
     *
     * They may not be larger than the size of the buffer
     * to simplify the buffering logic in this simple use case application.
     */
    static readonly maxChunkSize = S3ObjectStreamWritable.bufferSize;

    private writeBuffer = Buffer.alloc(S3ObjectStreamWritable.bufferSize);
    private bytesInBuffer = 0;
    private bufferedCallbacks: WriteCallback[] = [];
    private flushInProgress = false;
    private totalBytesReceived = 0;

    constructor(s3Client: S3Client, objRef: ObjectStoreReference, private encoding: BufferEncoding = 'utf8') {
        super(s3Client, objRef, S3ObjectStreamWritable.bufferSize, encoding);
    }

    write(chunk: any, callback?: ((error: Error | null | undefined) => void) | undefined): boolean;
    write(chunk: any, encoding: BufferEncoding, callback?: WriteCallback | undefined): boolean;
    write(chunk: any, encoding?: BufferEncoding | WriteCallback, callback?: (error: Error | null | undefined) => void): boolean {
        if (this.flushInProgress) {
            throw new Error('The internal writeBuffer is currently being flushed. Please wait for the drain event of readyToWrite().');
        }

        let cb: WriteCallback | undefined;
        if (typeof encoding === 'function') {
            cb = encoding as WriteCallback;
            encoding = this.encoding;
        } else {
            if (!encoding || (encoding as string) === 'buffer') {
                encoding = this.encoding;
            } else if (!Buffer.isEncoding(encoding)) {
                throw new Error(`Unknown encoding: ${encoding}`);
            }
            if (typeof callback === 'function') {
                cb = callback as (error: Error | null | undefined) => void;
            } else {
                cb = undefined;
            }
        }

        let buf: Buffer;
        if (Buffer.isBuffer(chunk)) {
            buf = chunk;
        } else if (chunk instanceof Uint8Array) {
            // This wraps the ArrayBuffer underlying the array, it does not copy the bytes.
            buf = Buffer.from(chunk);
        } else if (typeof chunk === 'string') {
            buf = Buffer.from(chunk, encoding);
        } else {
            throw new Error(`chunk must be a Buffer, Uint8Array, or string, but it was ${chunk ? chunk.prototype.name : chunk}`);
        }

        this.totalBytesReceived += buf.length;

        return this.appendToBuffer(buf, cb);
    }

    end(cb?: (() => void) | undefined): this;
    end(chunk: any, cb?: (() => void) | undefined): this;
    end(chunk: any, encoding: BufferEncoding, cb?: (() => void) | undefined): this;
    end(chunk?: any, encoding?: any, cb?: any): this {
        let callback: (() => void) | undefined;
        if (typeof chunk === 'function') {
            callback = chunk;
            chunk = undefined;
        } else {
            if (typeof encoding === 'function') {
                callback = encoding;
                encoding = undefined;
            } else if (typeof cb === 'function') {
                callback = cb;
            }
        }

        const endStream = () => {
            console.log(`Total bytes received: ${this.totalBytesReceived}`);
            if (this.bytesInBuffer > 0) {
                this.flushBuffer(() => super.end(callback));
            } else {
                super.end(callback);
            }
        };

        if (chunk) {
            this.write(chunk, () => endStream);
        } else {
            endStream();
        }
        return this;
    }

    private appendToBuffer(chunk: Buffer, callback?: WriteCallback): boolean {
        if (chunk.length > S3ObjectStreamWritable.maxChunkSize) {
            throw new Error(`chunk exceeds the max size of ${S3ObjectStreamWritable.maxChunkSize} bytes; chunk length in bytes=${chunk.length}`);
        }

        if (this.bytesInBuffer + chunk.length < this.writeBuffer.length) {
            this.bytesInBuffer += chunk.copy(this.writeBuffer, this.bytesInBuffer);
            if (callback) {
                this.bufferedCallbacks.push(callback);
            }
            return true;
        }

        // The chunk would cause the writeBuffer to overflow.
        // So, we copy as much into the writeBuffer as possible, flush the writeBuffer using super.write()
        // and then copy the rest into the writeBuffer.

        const firstChunkLength = this.writeBuffer.length - this.bytesInBuffer;
        const secondChunkLength = chunk.length - firstChunkLength;
        this.bytesInBuffer += chunk.copy(this.writeBuffer, this.bytesInBuffer, 0, firstChunkLength);

        const ret = this.flushBuffer(() => {
            if (secondChunkLength > 0) {
                this.bytesInBuffer = chunk.copy(this.writeBuffer, 0, firstChunkLength);
                if (callback) {
                    this.bufferedCallbacks.push(callback);
                }
            }
        });

        if (ret) {
            // Ensures that the underlying stream's drain and readyToWrite events are in sync with this stream.
            // This is very hacky, but for this purpose it works.
            throw new Error('UnbufferedS3ObjectStreamWritable.write() returned true, even though false was expected.');
        }
        return ret;
    }

    /**
     * Flushes the buffer using super.write() and calls the callback after flushing is complete, all bufferedCallbacks have been called,
     * and the buffer has been reset.
     * @returns The return value of super.write().
     */
    private flushBuffer(callback: WriteCallback): boolean {
        this.flushInProgress = true;
        let buf: Buffer;
        if (this.bytesInBuffer === this.writeBuffer.length) {
            buf = this.writeBuffer;
        } else {
            buf = Buffer.allocUnsafe(this.bytesInBuffer);
            this.writeBuffer.copy(buf, 0, 0, this.bytesInBuffer);
        }

        return super.write(buf, err => {
            this.processCallbacks(err);
            this.resetBuffer();
            this.flushInProgress = false;
            callback(err);
        });
    }

    private processCallbacks(result: Error | null | undefined): void {
        for (const cb of this.bufferedCallbacks) {
            cb(result);
        }
        this.bufferedCallbacks.length = 0;
    }

    private resetBuffer(): void {
        this.bytesInBuffer = 0;
        this.writeBuffer.fill(0);
    }
}
