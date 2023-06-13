import { CompleteMultipartUploadCommand, CreateMultipartUploadCommand, PutObjectCommand, S3Client, UploadPartCommand } from '@aws-sdk/client-s3';
import { Writable } from 'node:stream';
import { ObjectStoreReference } from '../model';
import { WritableStream } from '../object-store';

/** AWS requires multi-part uploads to have chunk size of at least 5 MB. */
const minChunkSize = 5 * 1024 * 1024;

interface PromiseHandle<T> {
    resolve: (value: T) => void;
    reject: (err: Error) => void;
}

export class S3ObjectStreamWritable extends Writable implements WritableStream {
    private uploadId: string | undefined;
    private finalPart = false;
    private lastPartId = 0;
    private uploadedPartsETags: string[] = [];
    private readyToWritePromises: PromiseHandle<void>[] = [];

    constructor(private s3Client: S3Client, private objRef: ObjectStoreReference, encoding?: BufferEncoding) {
        super({
            defaultEncoding: encoding,
            decodeStrings: true,
            highWaterMark: minChunkSize,
        });

        this.on('drain', () => this.handleDrainEvent());
    }

    _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void): void {
        // Since we set decodeStrings = true, chunk will always be a Buffer
        // We need to cover the following cases:
        // - First part of a multi-part upload (uploadId === undefined && finalPart === false)
        // - Subsequent part of a multi-part upload (uploadId !== undefined && finalPart === false)
        // - Final part of a multi-part upload (uploadId !== undefined && finalPart === true)
        // - Only part of a single upload file (uploadId === undefined && finalPart === true)

        let result$: Promise<void>;

        if (!this.uploadId) {
            if (!this.finalPart) {
                // First part of a multi-part upload (uploadId === undefined && finalPart === false)
                result$ = this.startMultiPartUpload().then(() => this.uploadPart(chunk));
            } else {
                // Final and only part of a single upload file (uploadId === undefined && finalPart === true)
                result$ = this.uploadSinglePartFile(chunk);
            }
        } else {
            if (!this.finalPart) {
                // Subsequent part of a multi-part upload (uploadId !== undefined && finalPart === false)
                result$ = this.uploadPart(chunk);
            } else {
                // Final part of a multi-part upload (uploadId !== undefined && finalPart === true)
                result$ = this.uploadPart(chunk).then(() => this.finishMultiPartUpload());
            }
        }

        result$
            .then(() => callback(null))
            .catch(err => {
                const errorMsg = JSON.stringify(err, undefined, 4);
                callback(new Error(errorMsg));
            });
    }

    end(cb?: (() => void) | undefined): this;
    end(chunk: any, cb?: (() => void) | undefined): this;
    end(chunk: any, encoding: BufferEncoding, cb?: (() => void) | undefined): this;
    end(chunk?: any, encoding?: any, cb?: any): this {
        this.finalPart = true;

        // If the buffer is currently empty, we need to finish the upload here, because _write() will not be called any more.
        if (this.writableLength === 0) {
            // We only need to finish the upload, if we have already uploaded a part.
            // Otherwise, if no data has been written, no file will be created,.
            if (this.uploadId) {
                this.finishMultiPartUpload()
                    .then(() => super.end(chunk, encoding, cb))
                    .catch(err => this.destroy(err));
                return this;
            }
        }

        return super.end(chunk, encoding, cb);
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

    readyToWrite(): Promise<void> {
        if (!this.writableNeedDrain) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            this.readyToWritePromises.push({ resolve, reject });
        });
    }

    private uploadSinglePartFile(data: Buffer): Promise<void> {
        const cmd = new PutObjectCommand({
            Bucket: this.objRef.bucket,
            Key: this.objRef.objectKey,
            Body: data,
        });

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return this.s3Client.send(cmd).then(() => {});
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
        if (!response.ChecksumSHA256) {
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

    private relayErrorToReadyToWritePromises(err: Error): void {
        let promHandle: PromiseHandle<void> | undefined;
        while ((promHandle = this.readyToWritePromises.pop())) {
            promHandle.reject(err);
        }
    }
}
