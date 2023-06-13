import * as readline from 'node:readline';
import { ReadLineByLine } from '../read-line-by-line';
import { ReadableStream } from '../object-store';

export class ReadLineByLineImpl implements ReadLineByLine {
    readonly encoding: BufferEncoding;

    private readLine: readline.Interface;
    private onLineReadCallback: ((line: string) => void) | undefined = undefined;
    private aborted = false;
    private paused = false;
    private pauseBuffer: string[] | undefined;

    constructor(encoding: BufferEncoding, private objStreamReadable: ReadableStream) {
        this.encoding = encoding;
        this.readLine = readline.createInterface(this.objStreamReadable);
    }

    pause(): void {
        this.paused = true;
        this.readLine.pause();
    }

    resume(): void {
        this.paused = false;

        if (this.pauseBuffer) {
            const pauseBuffer = this.pauseBuffer;
            this.pauseBuffer = undefined;

            for (const line of pauseBuffer) {
                // By using handleNextLine() we ensure that we can handle situations, where pause() is called again
                // before the pauseBuffer is empty.
                this.handleNextLine(line);
            }
        }

        // If the onLineReadCallback has not called pause again, we can now resume the readLine stream.
        if (!this.paused) {
            this.readLine.resume();
        }
    }

    abort(): void {
        this.aborted = true;
        this.objStreamReadable.abort();
    }

    onLineRead(callback: (line: string) => void): void {
        if (this.onLineReadCallback) {
            throw new Error('Only a single onLineRead callback can be registered.');
        }
        this.onLineReadCallback = callback;

        this.readLine.on('line', line => {
            this.handleNextLine(line);
        });
    }

    onEnd(callback: () => void): void {
        this.readLine.on('close', () => callback());
    }

    onError(callback: (err: Error) => void): void {
        this.objStreamReadable.on('error', err => callback(err));
    }

    private handleNextLine(line: string): void {
        if (!this.onLineReadCallback) {
            throw new Error('onLineReadCallback must not be undefined at this point.');
        }

        if (!this.aborted) {
            if (!this.paused) {
                this.onLineReadCallback(line);
            } else {
                this.addLineToPauseBuffer(line);
            }
        }
    }

    private addLineToPauseBuffer(line: string): void {
        if (!this.pauseBuffer) {
            this.pauseBuffer = [line];
        } else {
            this.pauseBuffer.push(line);
        }
    }
}
