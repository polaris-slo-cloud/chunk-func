import { ServerlessFunction } from './serverless-function';

// ToDo
/**
 * Represents a serverless workflow as a DAG.
 */
export interface Workflow {

    /**
     * The start of the serverless function.
     */
    start: ServerlessFunction
}
