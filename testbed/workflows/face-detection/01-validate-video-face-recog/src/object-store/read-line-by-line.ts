/**
 * Allows reading bytes streams as strings, line by line.
 */
export interface ReadLineByLine {
    /**
     * The text encoding used by this reader.
     */
    readonly encoding: BufferEncoding;

    /**
     * Pauses the stream until {@link resume} is called.
     */
    pause(): void;

    /**
     * Resumes the stream.
     */
    resume(): void;

    /**
     * Aborts the stream.
     */
    abort(): void;

    /**
     * Registers the callback function called for every line that is read.
     *
     * Only one callback can be registered.
     */
    onLineRead(callback: (line: string) => void): void;

    /**
     * Registers the callback function that is called when the underlying stream has ended.
     *
     * Registering this callback is optional.
     */
    onEnd(callback: () => void): void;

    /**
     * Registers the callback that is called when an error occurs.
     *
     * Registering this callback is optional.
     */
    onError(callback: (err: Error) => void): void;
}
