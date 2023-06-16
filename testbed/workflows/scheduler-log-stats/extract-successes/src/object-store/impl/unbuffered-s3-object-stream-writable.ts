import { CompleteMultipartUploadCommand, CreateMultipartUploadCommand, S3Client, UploadPartCommand } from '@aws-sdk/client-s3';
import { Writable } from 'node:stream';
import { ObjectStoreReference } from '../model';
import { WritableStream } from '../object-store';

/** AWS requires multi-part uploads to have a size of at least 5 MB. */
export const s3MinMultiPartSize = 5 * 1024 * 1024;

interface PromiseHandle<T> {
    resolve: (value: T) => void;
    reject: (err: Error) => void;
}

/**
 * Implements a WritableStream for an S3 object.
 * This stream assumes that each chunk that is written is either at least 5 MB or is the only chunk of the object.
 * Do not use this class directly, use {@link S3ObjectStreamWritable} instead, which provides buffering of smaller chunks.
 */
export class UnbufferedS3ObjectStreamWritable extends Writable implements WritableStream {
    /** The upload ID of a multi-part upload. */
    private uploadId: string | undefined;

    /** The ID of the last previous part of a multi-part upload that was uploaded. */
    private lastPartId = 0;

    /** The ETags of completed multi-part upload chunks. */
    private uploadedPartsETags: string[] = [];

    /** Promises currently waiting for the drain event. */
    private readyToWritePromises: PromiseHandle<void>[] = [];

    private totalBytesUploaded = 0;

    constructor(private s3Client: S3Client, private objRef: ObjectStoreReference, highWaterMark: number, encoding?: BufferEncoding) {
        super({
            defaultEncoding: encoding,
            decodeStrings: true,
            highWaterMark: highWaterMark,
        });

        this.on('drain', () => this.handleDrainEvent());
    }

    _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void): void {
        // Since we set decodeStrings = true, chunk should always be a Buffer.
        if (!(chunk instanceof Buffer)) {
            callback(new Error(`_write() expects chunk to be a Buffer, instead it is ${chunk}`));
            return;
        }

        let result$: Promise<void>;

        // If it's the first part, we need to start a new multi-part upload, otherwise we just upload the new part.
        // In either case we don't care if this is the final part, because finishMultiPartUpload() will be called by _final().
        // This works even if the object only consists of a single part (which may be smaller than s3MinMultiPartSize).
        if (!this.uploadId) {
            // First part of a multi-part upload.
            result$ = this.startMultiPartUpload().then(() => this.uploadPart(chunk));
        } else {
            // Subsequent part of a multi-part upload.
            result$ = this.uploadPart(chunk);
        }

        result$
            .then(() => {
                this.totalBytesUploaded += chunk.length;
                callback(null);
            })
            .catch(err => this.relayErrorToCallback(err, callback));
    }

    /**
     * Called by `Writable` before the stream is closed, after the buffer has been flushed.
     */
    _final(callback: (error?: Error | null | undefined) => void): void {
        console.log(`Total bytes uploaded: ${this.totalBytesUploaded}`);
        if (this.uploadId) {
            // We are in a multi-part upload, so we need to finish it now.
            this.finishMultiPartUpload()
                .then(() => callback(null))
                .catch(err => this.relayErrorToCallback(err, callback));
        } else {
            // We are not in a multi-part upload. It was either a single-part upload, which was completed by _write()
            // or no data was written at all. In either case, we are done.
            callback(null);
        }
    }

    end$(): Promise<void> {
        return new Promise((resolve, reject) => {
            let errorFromEvent: Error;
            this.once('error', err => {
                errorFromEvent = err;
            });

            this.end(errorFromCallback => {
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
        if (!this.writableNeedDrain) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            this.readyToWritePromises.push({ resolve, reject });
        });
    }

    private async startMultiPartUpload(): Promise<void> {
        const cmd = new CreateMultipartUploadCommand({
            Bucket: this.objRef.bucket,
            Key: this.objRef.objectKey,
        });

        const response = await this.s3Client.send(cmd);
        if (!response.UploadId) {
            throw new Error('Error in CreateMultipartUploadCommand');
        }
        this.uploadId = response.UploadId;
    }

    private async uploadPart(data: Buffer): Promise<void> {
        const partNumber = ++this.lastPartId;
        const cmd = new UploadPartCommand({
            Bucket: this.objRef.bucket,
            Key: this.objRef.objectKey,
            UploadId: this.uploadId,
            PartNumber: partNumber,
            Body: data,
        });

        const response = await this.s3Client.send(cmd);
        if (!response.ETag) {
            throw new Error(`Error uploading part ${partNumber}`);
        }
        this.uploadedPartsETags[partNumber - 1] = response.ETag;
    }

    private async finishMultiPartUpload(): Promise<void> {
        const cmd = new CompleteMultipartUploadCommand({
            Bucket: this.objRef.bucket,
            Key: this.objRef.objectKey,
            UploadId: this.uploadId,
            MultipartUpload: {
                Parts: this.uploadedPartsETags.map((eTag, i) => ({
                    ETag: eTag,
                    PartNumber: i + 1,
                })),
            },
        });

        const response = await this.s3Client.send(cmd);
        if (!response.ETag) {
            throw new Error('CompleteMultipartUploadCommand failed');
        }
    }

    private handleDrainEvent(): void {
        let resolvedCount = 0;
        for (let i = 0; i < this.readyToWritePromises.length; ++i) {
            if (!this.writableNeedDrain) {
                this.readyToWritePromises[i].resolve();
                ++resolvedCount;
            } else {
                break;
            }
        }
        this.readyToWritePromises = this.readyToWritePromises.splice(0, resolvedCount);
    }

    private relayErrorToCallback(err: any, callback: (error?: Error | null | undefined) => void): void {
        if (!(err instanceof Error)) {
            const errorMsg = JSON.stringify(err, undefined, 4);
            err = new Error(errorMsg);
        }
        callback(err);
        this.relayErrorToReadyToWritePromises(err);
    }

    private relayErrorToReadyToWritePromises(err: Error): void {
        let promHandle: PromiseHandle<void> | undefined;
        while ((promHandle = this.readyToWritePromises.pop())) {
            promHandle.reject(err);
        }
    }
}
