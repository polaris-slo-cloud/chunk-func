import * as fs from 'node:fs';
import { WritableStream } from '../object-store';
import { s3MinMultiPartSize } from './unbuffered-s3-object-stream-writable';

interface PromiseHandle<T> {
    resolve: (value: T) => void;
    reject: (err: Error) => void;
}

/**
 * WritableStream implementation for a local file.
 */
export class WritableFileStream implements WritableStream {
    private writeStream: fs.WriteStream;

    /** Promises currently waiting for the drain event. */
    private readyToWritePromises: PromiseHandle<void>[] = [];

    constructor(fileName: string, encoding: BufferEncoding = 'utf8') {
        this.writeStream = fs.createWriteStream(fileName, {
            encoding,
            highWaterMark: s3MinMultiPartSize,
        });
        this.on('drain', () => this.handleDrainEvent());
    }

    get writable(): boolean {
        return this.writeStream.writable;
    }

    end$(): Promise<void> {
        return new Promise((resolve, reject) => {
            let errorFromEvent: Error;
            this.once('error', err => {
                errorFromEvent = err;
            });

            this.writeStream.end(errorFromCallback => {
                // According to the API definition end() does not pass the error to the callback, but apparently it does.
                const rejectReason: Error = errorFromCallback || errorFromEvent;
                if (!rejectReason) {
                    resolve();
                } else {
                    reject(rejectReason);
                }
            });
        });
    }

    /**
     * @returns A promise that resolves when the stream is ready for writing (i.e., the buffer has been drained).
     * Note that any error relayed through the promise will also be propagated through the on('error') event.
     */
    readyToWrite(): Promise<void> {
        if (!this.writeStream.writableNeedDrain) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            this.readyToWritePromises.push({ resolve, reject });
        });
    }

    write(buffer: string | Uint8Array, cb?: ((err?: Error | null | undefined) => void) | undefined): boolean;
    write(str: string, encoding?: BufferEncoding | undefined, cb?: ((err?: Error | null | undefined) => void) | undefined): boolean;
    write(str: any, encoding?: any, cb?: any): boolean {
        return this.writeStream.write(str, encoding, cb);
    }

    end(cb?: (() => void) | undefined): this;
    end(data: string | Uint8Array, cb?: (() => void) | undefined): this;
    end(str: string, encoding?: BufferEncoding | undefined, cb?: (() => void) | undefined): this;
    end(str?: any, encoding?: any, cb?: any): this {
        this.writeStream.end(str, encoding, cb);
        return this;
    }

    addListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.writeStream.addListener(eventName, listener);
        return this;
    }

    on(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.writeStream.on(eventName, listener);
        return this;
    }

    once(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.writeStream.once(eventName, listener);
        return this;
    }

    removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.writeStream.removeListener(eventName, listener);
        return this;
    }

    off(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.writeStream.off(eventName, listener);
        return this;
    }

    removeAllListeners(event?: string | symbol | undefined): this {
        this.writeStream.removeAllListeners(event);
        return this;
    }

    setMaxListeners(n: number): this {
        this.writeStream.setMaxListeners(n);
        return this;
    }

    getMaxListeners(): number {
        return this.writeStream.getMaxListeners();
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    listeners(eventName: string | symbol): Function[] {
        return this.writeStream.listeners(eventName);
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    rawListeners(eventName: string | symbol): Function[] {
        return this.writeStream.rawListeners(eventName);
    }

    emit(eventName: string | symbol, ...args: any[]): boolean {
        return this.writeStream.emit(eventName, ...args);
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    listenerCount(eventName: string | symbol, listener?: Function | undefined): number {
        return this.writeStream.listenerCount(eventName, listener);
    }

    prependListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.writeStream.prependListener(eventName, listener);
        return this;
    }

    prependOnceListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.writeStream.prependOnceListener(eventName, listener);
        return this;
    }

    eventNames(): (string | symbol)[] {
        return this.writeStream.eventNames();
    }

    private handleDrainEvent(): void {
        let resolvedCount = 0;
        for (let i = 0; i < this.readyToWritePromises.length; ++i) {
            if (!this.writeStream.writableNeedDrain) {
                this.readyToWritePromises[i].resolve();
                ++resolvedCount;
            } else {
                break;
            }
        }
        this.readyToWritePromises = this.readyToWritePromises.splice(0, resolvedCount);
    }

    private relayErrorToReadyToWritePromises(err: Error): void {
        let promHandle: PromiseHandle<void> | undefined;
        while ((promHandle = this.readyToWritePromises.pop())) {
            promHandle.reject(err);
        }
    }
}
