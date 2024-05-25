import * as fs from 'node:fs';
import path from 'node:path';
import { stringify as csvStringify } from 'csv-stringify/sync';
import { SimulatorOutput } from '@chunk-func/core';
import { ProcessedSimulationResult } from './processed-simulation-result';

if (process.argv.length < 4) {
    console.log('Usage:');
    console.log('node main.js <results-dir> <output.csv>');
    process.exit(1);
}

const resultsDirPath = process.argv[2];
const outputFilePath = process.argv[3];

const dir = fs.opendirSync(resultsDirPath);
processResultsDir(dir)
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    .then(results => writeCsvFile(results, outputFilePath))
    .catch(err => console.error(err));

async function processResultsDir(resultsDir: fs.Dir): Promise<ProcessedSimulationResult[]> {
    const results: ProcessedSimulationResult[] = [];

    for await (const entry of resultsDir) {
        if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.json')) {
            continue;
        }

        const result = processResultFile(path.join(resultsDir.path, entry.name));
        results.push(result);
    }

    return results;
}

function processResultFile(filePath: string): ProcessedSimulationResult {
    const contents = fs.readFileSync(filePath, { encoding: 'utf-8' });
    const simResult = JSON.parse(contents) as SimulatorOutput;
    const inputSize = Math.round(simResult.inputDataSizeMib * 100) / 100;
    const sloSec = simResult.sloMs / 1000;

    return {
        strategy: simResult.resourceConfigStrategy.replace('ConfigStrategy', ''),
        scenario: `${inputSize}MB`,
        sloMs: simResult.sloMs,
        executionTimeMs: simResult.workflowOutput.executionTimeMs,
        cost: simResult.workflowOutput.executionCost,
        avgResConfigStratExecTimeMs: simResult.workflowOutput.avgResourceConfigStrategyExecutionTimeMs,
    };
}

function writeCsvFile(results: ProcessedSimulationResult[], destPath: string): void {
    const csvStr = csvStringify(results, { header: true });
    fs.writeFileSync(destPath, csvStr, { encoding: 'utf-8' });
}

