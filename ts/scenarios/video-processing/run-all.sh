#!/bin/bash
set -x

# Fastest ignores the SLO, so one scenario per input size is enough.
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-50s.yaml FastestConfigStrategy > ./simulation-logs/scenario-01-fastest.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-35s.yaml FastestConfigStrategy > ./simulation-logs/scenario-02-fastest.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-10s.yaml FastestConfigStrategy > ./simulation-logs/scenario-03-fastest.json

# # Cheapest ignores the SLO, so one scenario per input size is enough.
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-50s.yaml CheapestConfigStrategy > ./simulation-logs/scenario-01-cheapest.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-35s.yaml CheapestConfigStrategy > ./simulation-logs/scenario-02-cheapest.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-10s.yaml CheapestConfigStrategy > ./simulation-logs/scenario-03-cheapest.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-50s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-01-50s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-90s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-01-90s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-120s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-01-120s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-35s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-02-35s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-40s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-02-40s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-45s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-02-45s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-10s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-03-10s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-15s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-03-15s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-20s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-03-20s-slo-compliant.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-50s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-01-50s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-90s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-01-90s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-120s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-01-120s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-35s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-02-35s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-40s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-02-40s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-45s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-02-45s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-10s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-03-10s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-15s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-03-15s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-20s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-03-20s-proportional-slo.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-50s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-01-50s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-90s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-01-90s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-120s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-01-120s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-35s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-02-35s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-40s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-02-40s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-45s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-02-45s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-10s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-03-10s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-15s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-03-15s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-20s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-03-20s-proportional-critical-path-slo.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-50s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-50s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-90s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-90s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-120s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-120s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-35s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-35s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-40s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-40s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-45s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-45s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-10s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-10s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-15s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-15s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-20s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-20s-input-heuristic-proportional-cp-slo.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-50s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-50s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-90s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-90s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-120s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-120s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-35s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-35s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-40s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-40s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-45s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-45s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-10s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-10s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-15s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-15s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-20s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-20s-fixed-output-proportional-cp-slo.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-50s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-01-50s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-90s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-01-90s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-120s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-01-120s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-35s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-02-35s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-40s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-02-40s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-45s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-02-45s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-10s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-03-10s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-15s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-03-15s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-20s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-03-20s-input-heuristic.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-50s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-01-50s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-90s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-01-90s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-120s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-01-120s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-35s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-02-35s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-40s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-02-40s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-45s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-02-45s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-10s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-03-10s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-15s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-03-15s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-20s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-03-20s-fixed-input.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-50s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-01-50s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-90s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-01-90s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-120s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-01-120s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-35s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-02-35s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-40s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-02-40s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-45s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-02-45s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-10s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-03-10s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-15s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-03-15s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-20s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-03-20s-step-conf.json

node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-01-50s.yaml > ./simulation-logs/scenario-01-50s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-01-90s.yaml > ./simulation-logs/scenario-01-90s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-01-120s.yaml > ./simulation-logs/scenario-01-120s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-02-35s.yaml > ./simulation-logs/scenario-02-35s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-02-40s.yaml > ./simulation-logs/scenario-02-40s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-02-45s.yaml > ./simulation-logs/scenario-02-45s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-03-10s.yaml > ./simulation-logs/scenario-03-10s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-03-15s.yaml > ./simulation-logs/scenario-03-15s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-03-20s.yaml > ./simulation-logs/scenario-03-20s-slam.json

# # Convert the results to CSV
node ../../dist/packages/results-converter/main.js ./simulation-logs ./simulation-results.csv
