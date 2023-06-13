import { WritableStream } from './object-store';
import { ReadLineByLine } from './read-line-by-line';

export interface LineByLineTransformerConfig {
    /** The input stream. */
    input: ReadLineByLine;

    /** The output stream. */
    output: WritableStream;

    /**
     * Optional method to write a header to the output stream.
     * If `undefined` is returned, nothing is written.
     */
    writeHeader?: () => string | undefined;

    /**
     * Transforms a single line.
     * If `undefined` is returned, nothing is written.
     */
    transformLine: (line: string) => string | undefined;

    /**
     * Optional method to write a header to the output stream.
     * If `undefined` is returned, nothing is written.
     */
    writeFooter?: () => string | undefined;
}

/**
 * Transforms a stream line-by-line and writes the transformed output to an output stream.
 */
export class LineByLineTransformer {
    private resolvePromise: (() => void) | undefined;
    private rejectPromise: ((err: Error) => void) | undefined;
    private promiseRejected = false;

    constructor(private config: LineByLineTransformerConfig) {}

    /**
     * Starts the transformation process.
     *
     * @returns A promise that resolves when the transformation is complete.
     */
    start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.resolvePromise = resolve;
            this.rejectPromise = reject;

            if (this.config.writeHeader) {
                const header = this.config.writeHeader();
                if (header) {
                    // We assume that the stream is writable and requires no draining at the beginning.
                    // We also assume that the header is not so long that it will fill the buffer, so that write() returns false.
                    // Since this is a demo, this is acceptable.
                    this.config.output.write(header);
                }
            }

            this.setUpHandlers();
        });
    }

    private setUpHandlers(): void {
        this.config.output.on('error', err => this.handleError(err));
        this.config.input.onLineRead(line => this.handleLine(line));
        this.config.input.onEnd(() => this.handleInputEnd());
        this.config.input.onError(err => this.handleError(err));
    }

    private handleLine(line: string): void {
        const transformed = this.config.transformLine(line);
        if (!transformed) {
            return;
        }

        const readyToContinueWriting = this.config.output.write(transformed);
        if (!readyToContinueWriting) {
            this.config.input.pause();
            this.config.output
                .readyToWrite()
                .then(() => this.config.input.resume())
                .catch(err => this.handleError(err));
        }
    }

    private handleInputEnd(): void {
        this.writeFooter()
            .then(() => this.config.output.end$())
            .then(() => this.resolvePromise!())
            .catch(err => this.handleError(err));
    }

    private handleError(err: Error): void {
        if (this.rejectPromise && !this.promiseRejected) {
            // In case we receive multiple errors (e.g., if there is an error on end$() we might also receive an error from the on('error')
            // event handler), we want to reject the promise only once.
            this.promiseRejected = true;
            this.rejectPromise(err);
        }
    }

    private writeFooter(): Promise<void> {
        if (this.config.writeFooter) {
            const footer = this.config.writeFooter();
            if (footer) {
                return this.config.output.readyToWrite().then(() => {
                    this.config.output.write(footer);
                });
            }
        }
        return Promise.resolve();
    }
}
