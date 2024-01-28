#!/bin/bash
set -x

echo "Removing all JSON files from output directory"
rm ./simulation-logs/*.json

# Fastest ignores the SLO, so one scenario per input size is enough.
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01.yaml FastestConfigStrategy > ./simulation-logs/scenario-01-fastest.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02.yaml FastestConfigStrategy > ./simulation-logs/scenario-02-fastest.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03.yaml FastestConfigStrategy > ./simulation-logs/scenario-03-fastest.json

# Cheapest ignores the SLO, so one scenario per input size is enough.
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01.yaml CheapestConfigStrategy > ./simulation-logs/scenario-01-cheapest.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02.yaml CheapestConfigStrategy > ./simulation-logs/scenario-02-cheapest.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03.yaml CheapestConfigStrategy > ./simulation-logs/scenario-03-cheapest.json

# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-01-slo-compliant.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-02-slo-compliant.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-03-slo-compliant.json

# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-01-proportional-critical-path-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-02-proportional-critical-path-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-03-proportional-critical-path-slo.json

# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01.yaml SpreadSearchConfigStrategy > ./simulation-logs/scenario-01-spread-search.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02.yaml SpreadSearchConfigStrategy > ./simulation-logs/scenario-02-spread-search.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03.yaml SpreadSearchConfigStrategy > ./simulation-logs/scenario-03-spread-search.json

# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01.yaml HybridSearchConfigStrategy > ./simulation-logs/scenario-01-spread-search.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02.yaml HybridSearchConfigStrategy > ./simulation-logs/scenario-02-spread-search.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03.yaml HybridSearchConfigStrategy > ./simulation-logs/scenario-03-spread-search.json

# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-input-heuristic-proportional-cp-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-input-heuristic-proportional-cp-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-input-heuristic-proportional-cp-slo.json

# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-fixed-output-proportional-cp-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-fixed-output-proportional-cp-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-fixed-output-proportional-cp-slo.json

# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-01-input-heuristic.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-02-input-heuristic.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-03-input-heuristic.json

# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-01-fixed-input.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-02-fixed-input.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-03-fixed-input.json

# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01.yaml StepConfConfigStrategy > ./simulation-logs/scenario-01-step-conf.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02.yaml StepConfConfigStrategy > ./simulation-logs/scenario-02-step-conf.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03.yaml StepConfConfigStrategy > ./simulation-logs/scenario-03-step-conf.json

# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01.yaml SlamConfigStrategy slam-scenario.yaml > ./simulation-logs/scenario-01-slam.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02.yaml SlamConfigStrategy slam-scenario.yaml > ./simulation-logs/scenario-02-slam.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03.yaml SlamConfigStrategy slam-scenario.yaml > ./simulation-logs/scenario-03-slam.json

# # Convert the results to CSV
# node ../../dist/packages/results-converter/main.js ./simulation-logs ./simulation-results.csv
