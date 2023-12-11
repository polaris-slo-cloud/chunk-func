import { SimulatorOutput } from '../simulator';
import { SlamOutput } from './config-finder';

export interface SlamSimulatorOutput extends SimulatorOutput {

    /** The name of the scenario used by SLAM to find a config. */
    slamScenario: string;

    /** The result of finding the SLAM config. */
    slamResult: SlamOutput;

}
