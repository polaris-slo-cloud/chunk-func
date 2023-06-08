import { GetObjectCommand, GetObjectCommandOutput, S3Client } from '@aws-sdk/client-s3';
import { ObjectStoreReference } from '../model';
import { ObjectReader, ReadLineByLineOptions } from '../object-store';
import * as readline from 'readline';
import { ObjectStreamReadable } from './streams';

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

        return await response.Body.transformToByteArray();
    }

    readLineByLine(options: ReadLineByLineOptions): void {
        const objReadable = new ObjectStreamReadable(this, options.encoding || 'utf8');
        const rl = readline.createInterface(objReadable);
        let aborted = false;

        rl.on('line', (line) => {
            if (!aborted) {
                if (!options.onLineRead(line)) {
                    aborted = true;
                    objReadable.abort();
                }
            }
        });

        rl.on('close', () => {
            if (options.onEnd) {
                options.onEnd();
            }
        });

        objReadable.on('error', (err) => {
            if (options.onError) {
                options.onError(err);
            }
        });
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
