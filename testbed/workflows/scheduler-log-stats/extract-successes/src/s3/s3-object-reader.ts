import { GetObjectCommand, GetObjectCommandOutput, S3Client } from '@aws-sdk/client-s3';
import { createWriteStream, createReadStream } from 'fs';
import { S3ObjectReference } from './model';

const oneMB = 1024 * 1024;

export interface S3ObjectReader {
    /**
     * Reads the specified number of bytes and returns them in a buffer.
     *
     * @returns A buffer with the read bytes or `null` if the end of the object has been reached.
     */
    readBytes(count: number): Promise<Buffer | null>;
}

export class S3ObjectReaderImpl implements S3ObjectReader {
    private lastPos = -1;

    constructor(private s3Client: S3Client, private objRef: S3ObjectReference) {}

    async readBytes(count: number): Promise<Buffer | null> {
        const response = await this.getObjectRange(this.lastPos + 1, this.lastPos + count);
        if (!response.ContentRange || !response.Body) {
            throw new Error('Error reading from S3 bucket');
        }

        const range = this.getRangeAndLength(response.ContentRange);
        this.lastPos = range.end;

        if (range.length === 0) {
            return null;
        }

        const content = await response.Body.transformToByteArray();
        return Buffer.from(content);
    }

    private getObjectRange(start: number, end: number): Promise<GetObjectCommandOutput> {
        const command = new GetObjectCommand({
            Bucket: this.objRef.bucket,
            Key: this.objRef.objectKey,
            Range: `bytes=${start}-${end}`
        });

        return this.s3Client.send(command);
    }

    private getRangeAndLength(contentRange: string) {
        const [range, length] = contentRange.split('/');
        const [start, end] = range.split('-');
        return {
            start: parseInt(start),
            end: parseInt(end),
            length: parseInt(length),
        };
    }
}
