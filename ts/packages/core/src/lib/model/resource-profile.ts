
/**
 * Represents a set of resource configuration parameters for a serverless function and the associated cost.
 */
export interface ResourceProfile {

    /**
     * The amount of memory for a single function instance in MiB.
     * @type integer
     */
    memoryMiB: number;

    /**
     * The amount of milli CPU cores for a single function instance.
     * @type integer
     */
    milliCpu: number;

    /**
     * The price for this configuration for 100ms of uptime.
     */
    price100Ms: number;

}
