#!/bin/bash
set -x

# Fastest ignores the SLO, so one scenario per input size is enough.
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-56s.yaml FastestConfigStrategy > ./simulation-logs/scenario-01-fastest.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-37s.yaml FastestConfigStrategy > ./simulation-logs/scenario-02-fastest.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-11.5s.yaml FastestConfigStrategy > ./simulation-logs/scenario-03-fastest.json

# # Cheapest ignores the SLO, so one scenario per input size is enough.
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-56s.yaml CheapestConfigStrategy > ./simulation-logs/scenario-01-cheapest.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-37s.yaml CheapestConfigStrategy > ./simulation-logs/scenario-02-cheapest.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-11.5s.yaml CheapestConfigStrategy > ./simulation-logs/scenario-03-cheapest.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-56s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-01-56s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-67.5s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-01-67.5s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-78.5s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-01-78.5s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-37s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-02-37s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-44s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-02-44s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-51.5s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-02-51.5s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-11.5s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-03-11.5s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-14s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-03-14s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-16s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-03-16s-slo-compliant.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-56s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-01-56s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-67.5s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-01-67.5s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-78.5s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-01-78.5s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-37s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-02-37s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-44s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-02-44s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-51.5s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-02-51.5s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-11.5s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-03-11.5s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-14s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-03-14s-proportional-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-16s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-03-16s-proportional-slo.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-56s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-01-56s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-67.5s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-01-67.5s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-78.5s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-01-78.5s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-37s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-02-37s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-44s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-02-44s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-51.5s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-02-51.5s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-11.5s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-03-11.5s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-14s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-03-14s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-16s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-03-16s-proportional-critical-path-slo.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-56s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-56s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-67.5s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-67.5s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-78.5s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-78.5s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-37s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-37s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-44s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-44s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-51.5s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-51.5s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-11.5s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-11.5s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-14s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-14s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-16s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-16s-input-heuristic-proportional-cp-slo.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-56s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-56s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-67.5s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-67.5s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-78.5s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-78.5s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-37s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-37s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-44s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-44s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-51.5s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-51.5s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-11.5s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-11.5s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-14s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-14s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-16s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-16s-fixed-output-proportional-cp-slo.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-56s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-01-56s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-67.5s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-01-67.5s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-78.5s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-01-78.5s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-37s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-02-37s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-44s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-02-44s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-51.5s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-02-51.5s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-11.5s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-03-11.5s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-14s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-03-14s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-16s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-03-16s-input-heuristic.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-56s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-01-56s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-67.5s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-01-67.5s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-78.5s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-01-78.5s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-37s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-02-37s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-44s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-02-44s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-51.5s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-02-51.5s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-11.5s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-03-11.5s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-14s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-03-14s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-16s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-03-16s-fixed-input.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-56s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-01-56s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-67.5s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-01-67.5s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-78.5s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-01-78.5s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-37s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-02-37s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-44s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-02-44s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-51.5s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-02-51.5s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-11.5s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-03-11.5s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-14s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-03-14s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-16s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-03-16s-step-conf.json

node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-01-56s.yaml > ./simulation-logs/scenario-01-56s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-01-67.5s.yaml > ./simulation-logs/scenario-01-67.5s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-01-78.5s.yaml > ./simulation-logs/scenario-01-78.5s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-02-37s.yaml > ./simulation-logs/scenario-02-37s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-02-44s.yaml > ./simulation-logs/scenario-02-44s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-02-51.5s.yaml > ./simulation-logs/scenario-02-51.5s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-03-11.5s.yaml > ./simulation-logs/scenario-03-11.5s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-03-14s.yaml > ./simulation-logs/scenario-03-14s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-03-16s.yaml > ./simulation-logs/scenario-03-16s-slam.json

# # Convert the results to CSV
node ../../dist/packages/results-converter/main.js ./simulation-logs ./simulation-results.csv
