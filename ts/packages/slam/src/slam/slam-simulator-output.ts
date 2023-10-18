import { SimulatorOutput } from '@chunk-func/core';
import { SlamOutput } from './config-finder';

export interface SlamSimulatorOutput extends SimulatorOutput {

    /** The name of the scenario used by SLAM to find a config. */
    slamScenario: string;

    /** The result of finding the SLAM config. */
    slamResult: SlamOutput;

    /** Contains the error info if an error occurred. */
    error?: any;

}
