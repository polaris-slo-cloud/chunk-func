
/**
 * Defines properties of input/output data.
 */
export interface InputOutputData<T = any> {

    /** The size of the data in bytes. */
    sizeBytes: number;

    data?: T;

}
