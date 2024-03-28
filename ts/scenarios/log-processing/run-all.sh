#!/bin/bash
# set -x

CHUNK_FUNC_SIM_JS="../../dist/packages/chunk-func-sim/main.js"
RESULTS_CONVERTER_JS="../../dist/packages/results-converter/main.js"

function runSimulation() {
    local profilesType=$1

    # Fastest ignores the SLO, so one scenario per input size is enough.
    node "$CHUNK_FUNC_SIM_JS" workflow-${profilesType}.yaml scenario-01.yaml FastestConfigStrategy > ./simulation-logs/scenario-01-${profilesType}-fastest.json
    node "$CHUNK_FUNC_SIM_JS" workflow-${profilesType}.yaml scenario-02.yaml FastestConfigStrategy > ./simulation-logs/scenario-02-${profilesType}-fastest.json
    node "$CHUNK_FUNC_SIM_JS" workflow-${profilesType}.yaml scenario-03.yaml FastestConfigStrategy > ./simulation-logs/scenario-03-${profilesType}-fastest.json

    # Cheapest ignores the SLO, so one scenario per input size is enough.
    node "$CHUNK_FUNC_SIM_JS" workflow-${profilesType}.yaml scenario-01.yaml CheapestConfigStrategy > ./simulation-logs/scenario-01-${profilesType}-cheapest.json
    node "$CHUNK_FUNC_SIM_JS" workflow-${profilesType}.yaml scenario-02.yaml CheapestConfigStrategy > ./simulation-logs/scenario-02-${profilesType}-cheapest.json
    node "$CHUNK_FUNC_SIM_JS" workflow-${profilesType}.yaml scenario-03.yaml CheapestConfigStrategy > ./simulation-logs/scenario-03-${profilesType}-cheapest.json

    # # Convert the results to CSV
    # node "$RESULTS_CONVERTER_JS" ./simulation-logs ./simulation-results-${profilesType}.csv
}

echo "Removing all JSON files from output directory"
rm ./simulation-logs/*.json

# We only run AWS and GCF here, but not AWS-BO, because the fastest and cheapest strategies only rely on the exhaustiveProfilingResults.
runSimulation "aws"
runSimulation "gcf"
