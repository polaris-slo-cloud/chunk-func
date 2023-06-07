import { GetObjectCommand, GetObjectCommandOutput, S3Client } from '@aws-sdk/client-s3';
import { createWriteStream, createReadStream } from 'fs';
import { ObjectStoreReference } from '../model';
import { ObjectReader } from '../object-store';

export interface S3ObjectInfo {
    objRef: ObjectStoreReference;
    size: number;
}

export class S3ObjectReader implements ObjectReader {
    /** The index of the byte that was last read. */
    private lastReadPos = -1;

    constructor(private s3Client: S3Client, private objInfo: S3ObjectInfo) {}

    size(): number {
        return this.objInfo.size;
    }

    async readBytes(count: number): Promise<Uint8Array | undefined> {
        const readStart = this.lastReadPos + 1;
        let readEnd = this.lastReadPos + count;
        if (readStart === this.objInfo.size) {
            return undefined;
        }
        if (readEnd >= this.objInfo.size) {
            readEnd = this.objInfo.size - 1;
        }

        const response = await this.getObjectRange(readStart, readEnd);
        if (!response.ContentRange || !response.Body) {
            throw new Error('Error reading from S3 bucket');
        }

        const range = this.getRangeAndLength(response.ContentRange);
        this.lastReadPos = range.end;

        return await response.Body.transformToByteArray();
    }

    private getObjectRange(start: number, end: number): Promise<GetObjectCommandOutput> {
        const command = new GetObjectCommand({
            Bucket: this.objInfo.objRef.bucket,
            Key: this.objInfo.objRef.objectKey,
            Range: `bytes=${start}-${end}`,
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
