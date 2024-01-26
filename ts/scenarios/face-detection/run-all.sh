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

# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-11s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-01-11s-slo-compliant.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-12s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-01-12s-slo-compliant.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-13s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-01-13s-slo-compliant.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-7.0s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-02-7.0s-slo-compliant.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-7.5s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-02-7.5s-slo-compliant.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-8s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-02-8s-slo-compliant.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-0.5s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-03-0.5s-slo-compliant.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-0.75s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-03-0.75s-slo-compliant.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-1.0s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-03-1.0s-slo-compliant.json

# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-11s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-01-11s-proportional-critical-path-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-12s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-01-12s-proportional-critical-path-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-13s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-01-13s-proportional-critical-path-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-7.0s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-02-7.0s-proportional-critical-path-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-7.5s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-02-7.5s-proportional-critical-path-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-8s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-02-8s-proportional-critical-path-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-0.5s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-03-0.5s-proportional-critical-path-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-0.75s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-03-0.75s-proportional-critical-path-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-1.0s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-03-1.0s-proportional-critical-path-slo.json

# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-11s.yaml SpreadSearchConfigStrategy > ./simulation-logs/scenario-01-11s-spread-search.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-12s.yaml SpreadSearchConfigStrategy > ./simulation-logs/scenario-01-12s-spread-search.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-13s.yaml SpreadSearchConfigStrategy > ./simulation-logs/scenario-01-13s-spread-search.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-7.0s.yaml SpreadSearchConfigStrategy > ./simulation-logs/scenario-02-7.0s-spread-search.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-7.5s.yaml SpreadSearchConfigStrategy > ./simulation-logs/scenario-02-7.5s-spread-search.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-8s.yaml SpreadSearchConfigStrategy > ./simulation-logs/scenario-02-8s-spread-search.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-0.5s.yaml SpreadSearchConfigStrategy > ./simulation-logs/scenario-03-0.5s-spread-search.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-0.75s.yaml SpreadSearchConfigStrategy > ./simulation-logs/scenario-03-0.75s-spread-search.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-1.0s.yaml SpreadSearchConfigStrategy > ./simulation-logs/scenario-03-1.0s-spread-search.json

# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-11s.yaml HybridSearchConfigStrategy > ./simulation-logs/scenario-01-11s-spread-search.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-12s.yaml HybridSearchConfigStrategy > ./simulation-logs/scenario-01-12s-spread-search.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-13s.yaml HybridSearchConfigStrategy > ./simulation-logs/scenario-01-13s-spread-search.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-7.0s.yaml HybridSearchConfigStrategy > ./simulation-logs/scenario-02-7.0s-spread-search.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-7.5s.yaml HybridSearchConfigStrategy > ./simulation-logs/scenario-02-7.5s-spread-search.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-8s.yaml HybridSearchConfigStrategy > ./simulation-logs/scenario-02-8s-spread-search.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-0.5s.yaml HybridSearchConfigStrategy > ./simulation-logs/scenario-03-0.5s-spread-search.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-0.75s.yaml HybridSearchConfigStrategy > ./simulation-logs/scenario-03-0.75s-spread-search.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-1.0s.yaml HybridSearchConfigStrategy > ./simulation-logs/scenario-03-1.0s-spread-search.json

# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-11s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-11s-input-heuristic-proportional-cp-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-12s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-12s-input-heuristic-proportional-cp-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-13s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-13s-input-heuristic-proportional-cp-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-7.0s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-7.0s-input-heuristic-proportional-cp-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-7.5s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-7.5s-input-heuristic-proportional-cp-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-8s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-8s-input-heuristic-proportional-cp-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-0.5s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-0.5s-input-heuristic-proportional-cp-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-0.75s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-0.75s-input-heuristic-proportional-cp-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-1.0s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-1.0s-input-heuristic-proportional-cp-slo.json

# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-11s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-11s-fixed-output-proportional-cp-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-12s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-12s-fixed-output-proportional-cp-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-13s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-13s-fixed-output-proportional-cp-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-7.0s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-7.0s-fixed-output-proportional-cp-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-7.5s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-7.5s-fixed-output-proportional-cp-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-8s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-8s-fixed-output-proportional-cp-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-0.5s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-0.5s-fixed-output-proportional-cp-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-0.75s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-0.75s-fixed-output-proportional-cp-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-1.0s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-1.0s-fixed-output-proportional-cp-slo.json

# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-11s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-01-11s-input-heuristic.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-12s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-01-12s-input-heuristic.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-13s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-01-13s-input-heuristic.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-7.0s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-02-7.0s-input-heuristic.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-7.5s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-02-7.5s-input-heuristic.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-8s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-02-8s-input-heuristic.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-0.5s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-03-0.5s-input-heuristic.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-0.75s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-03-0.75s-input-heuristic.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-1.0s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-03-1.0s-input-heuristic.json

# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-11s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-01-11s-fixed-input.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-12s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-01-12s-fixed-input.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-13s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-01-13s-fixed-input.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-7.0s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-02-7.0s-fixed-input.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-7.5s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-02-7.5s-fixed-input.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-8s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-02-8s-fixed-input.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-0.5s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-03-0.5s-fixed-input.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-0.75s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-03-0.75s-fixed-input.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-1.0s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-03-1.0s-fixed-input.json

# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-11s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-01-11s-step-conf.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-12s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-01-12s-step-conf.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-13s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-01-13s-step-conf.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-7.0s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-02-7.0s-step-conf.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-7.5s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-02-7.5s-step-conf.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-8s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-02-8s-step-conf.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-0.5s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-03-0.5s-step-conf.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-0.75s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-03-0.75s-step-conf.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-1.0s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-03-1.0s-step-conf.json

# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-11s.yaml SlamConfigStrategy slam-scenario.yaml > ./simulation-logs/scenario-01-11s-slam.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-12s.yaml SlamConfigStrategy slam-scenario.yaml > ./simulation-logs/scenario-01-12s-slam.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-13s.yaml SlamConfigStrategy slam-scenario.yaml > ./simulation-logs/scenario-01-13s-slam.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-7.0s.yaml SlamConfigStrategy slam-scenario.yaml > ./simulation-logs/scenario-02-7.0s-slam.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-7.5s.yaml SlamConfigStrategy slam-scenario.yaml > ./simulation-logs/scenario-02-7.5s-slam.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-8s.yaml SlamConfigStrategy slam-scenario.yaml > ./simulation-logs/scenario-02-8s-slam.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-0.5s.yaml SlamConfigStrategy slam-scenario.yaml > ./simulation-logs/scenario-03-0.5s-slam.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-0.75s.yaml SlamConfigStrategy slam-scenario.yaml > ./simulation-logs/scenario-03-0.75s-slam.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-1.0s.yaml SlamConfigStrategy slam-scenario.yaml > ./simulation-logs/scenario-03-1.0s-slam.json

# # Convert the results to CSV
# node ../../dist/packages/results-converter/main.js ./simulation-logs ./simulation-results.csv
