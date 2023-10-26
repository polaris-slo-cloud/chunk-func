#!/bin/bash
set -x

# Fastest ignores the SLO, so one scenario per input size is enough.
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-49.5s.yaml FastestConfigStrategy > ./simulation-logs/scenario-01-fastest.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-33s.yaml FastestConfigStrategy > ./simulation-logs/scenario-02-fastest.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-10s.yaml FastestConfigStrategy > ./simulation-logs/scenario-03-fastest.json

# # Cheapest ignores the SLO, so one scenario per input size is enough.
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-49.5s.yaml CheapestConfigStrategy > ./simulation-logs/scenario-01-cheapest.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-33s.yaml CheapestConfigStrategy > ./simulation-logs/scenario-02-cheapest.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-10s.yaml CheapestConfigStrategy > ./simulation-logs/scenario-03-cheapest.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-49.5s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-01-49.5s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-54s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-01-54s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-58.5s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-01-58.5s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-33s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-02-33s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-36s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-02-36s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-39s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-02-39s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-10s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-03-10s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-11s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-03-11s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-12s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-03-12s-slo-compliant.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-49.5s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-01-49.5s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-54s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-01-54s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-58.5s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-01-58.5s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-33s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-02-33s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-36s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-02-36s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-39s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-02-39s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-10s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-03-10s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-11s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-03-11s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-12s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-03-12s-proportional-slo.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-49.5s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-01-49.5s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-54s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-01-54s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-58.5s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-01-58.5s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-33s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-02-33s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-36s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-02-36s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-39s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-02-39s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-10s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-03-10s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-11s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-03-11s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-12s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-03-12s-proportional-critical-path-slo.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-49.5s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-49.5s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-54s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-54s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-58.5s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-58.5s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-33s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-33s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-36s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-36s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-39s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-39s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-10s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-10s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-11s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-11s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-12s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-12s-input-heuristic-proportional-cp-slo.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-49.5s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-49.5s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-54s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-54s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-58.5s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-58.5s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-33s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-33s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-36s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-36s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-39s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-39s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-10s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-10s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-11s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-11s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-12s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-12s-fixed-output-proportional-cp-slo.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-49.5s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-01-49.5s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-54s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-01-54s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-58.5s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-01-58.5s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-33s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-02-33s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-36s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-02-36s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-39s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-02-39s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-10s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-03-10s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-11s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-03-11s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-12s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-03-12s-input-heuristic.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-49.5s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-01-49.5s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-54s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-01-54s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-58.5s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-01-58.5s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-33s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-02-33s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-36s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-02-36s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-39s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-02-39s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-10s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-03-10s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-11s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-03-11s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-12s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-03-12s-fixed-input.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-49.5s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-01-49.5s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-54s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-01-54s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-58.5s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-01-58.5s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-33s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-02-33s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-36s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-02-36s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-39s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-02-39s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-10s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-03-10s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-11s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-03-11s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-12s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-03-12s-step-conf.json

node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-01-49.5s.yaml > ./simulation-logs/scenario-01-49.5s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-01-54s.yaml > ./simulation-logs/scenario-01-54s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-01-58.5s.yaml > ./simulation-logs/scenario-01-58.5s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-02-33s.yaml > ./simulation-logs/scenario-02-33s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-02-36s.yaml > ./simulation-logs/scenario-02-36s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-02-39s.yaml > ./simulation-logs/scenario-02-39s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-03-10s.yaml > ./simulation-logs/scenario-03-10s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-03-11s.yaml > ./simulation-logs/scenario-03-11s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-03-12s.yaml > ./simulation-logs/scenario-03-12s-slam.json

# # Convert the results to CSV
node ../../dist/packages/results-converter/main.js ./simulation-logs ./simulation-results.csv
