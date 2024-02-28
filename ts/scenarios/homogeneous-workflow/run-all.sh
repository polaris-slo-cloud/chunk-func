#!/bin/bash
set -x

echo "Removing all JSON files from output directory"
rm ./simulation-logs/*.json

# Fastest ignores the SLO, so one scenario per input size is enough.
node ../../dist/packages/chunk-func-sim/main.js workflow-gcf.yaml scenario-01.yaml FastestConfigStrategy > ./simulation-logs/scenario-01-gcf-fastest.json
node ../../dist/packages/chunk-func-sim/main.js workflow-gcf.yaml scenario-02.yaml FastestConfigStrategy > ./simulation-logs/scenario-02-gcf-fastest.json
node ../../dist/packages/chunk-func-sim/main.js workflow-gcf.yaml scenario-03.yaml FastestConfigStrategy > ./simulation-logs/scenario-03-gcf-fastest.json

# Cheapest ignores the SLO, so one scenario per input size is enough.
node ../../dist/packages/chunk-func-sim/main.js workflow-gcf.yaml scenario-01.yaml CheapestConfigStrategy > ./simulation-logs/scenario-01-gcf-cheapest.json
node ../../dist/packages/chunk-func-sim/main.js workflow-gcf.yaml scenario-02.yaml CheapestConfigStrategy > ./simulation-logs/scenario-02-gcf-cheapest.json
node ../../dist/packages/chunk-func-sim/main.js workflow-gcf.yaml scenario-03.yaml CheapestConfigStrategy > ./simulation-logs/scenario-03-gcf-cheapest.json

# # Convert the results to CSV
# node ../../dist/packages/results-converter/main.js ./simulation-logs ./simulation-results-gcf.csv
