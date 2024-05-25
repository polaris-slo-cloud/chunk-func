import { GetObjectCommand, GetObjectCommandOutput, S3Client } from '@aws-sdk/client-s3';
import { ObjectStoreReference } from '../model';
import { ObjectReader, ReadableStream } from '../object-store';
import { ObjectStreamReadable } from './object-stream-readable';
import { ReadLineByLine } from '../read-line-by-line';
import { ReadLineByLineImpl } from './read-line-by-line.impl';

export interface S3ObjectInfo {
    objRef: ObjectStoreReference;
    size: number;
}

export class S3ObjectReader implements ObjectReader {
    /** The index of the byte that would be read on the next read operation. */
    private _currPos = 0;

    private s3Client: S3Client | undefined;

    constructor(s3Client: S3Client, private objInfo: S3ObjectInfo) {
        this.s3Client = s3Client;
    }

    get size(): number {
        return this.objInfo.size;
    }

    get currPos(): number {
        return this._currPos;
    }

    close(): void {
        this.s3Client = undefined;
    }

    seekTo(pos: number): void {
        if (pos <= this.size) {
            if (pos >= 0) {
                this._currPos = pos;
            } else {
                this._currPos = 0;
            }
        } else {
            this._currPos = this.size;
        }
    }

    async readBytes(count: number): Promise<Uint8Array | null> {
        const readStart = this._currPos;
        let readEnd = readStart + count - 1;
        if (readStart === this.objInfo.size) {
            return null;
        }
        if (readEnd >= this.objInfo.size) {
            readEnd = this.objInfo.size - 1;
        }

        const response = await this.getObjectRange(readStart, readEnd);
        if (!response.ContentRange || !response.Body) {
            throw new Error('Error reading from S3 bucket');
        }

        const range = this.getRangeAndLength(response.ContentRange);
        this._currPos = range.end + 1;

        return response.Body.transformToByteArray();
    }

    getReadableStream(encoding?: BufferEncoding): ReadableStream {
        return this.createObjectStreamReadable(encoding);
    }

    readLineByLine(encoding: BufferEncoding = 'utf8'): ReadLineByLine {
        const objReadable = this.createObjectStreamReadable(encoding);
        return new ReadLineByLineImpl(encoding, objReadable);
    }

    private createObjectStreamReadable(encoding?: BufferEncoding): ObjectStreamReadable {
        return new ObjectStreamReadable(this, encoding);
    }

    private getObjectRange(start: number, end: number): Promise<GetObjectCommandOutput> {
        const command = new GetObjectCommand({
            Bucket: this.objInfo.objRef.bucket,
            Key: this.objInfo.objRef.objectKey,
            Range: `bytes=${start}-${end}`,
        });

        if (!this.s3Client) {
            throw new Error('This reader has already been closed.');
        }

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
