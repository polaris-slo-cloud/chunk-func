#!/bin/bash
set -x

# Fastest ignores the SLO, so one scenario per input size is enough.
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-120s.yaml FastestConfigStrategy > ./simulation-logs/scenario-01-fastest.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-35s.yaml FastestConfigStrategy > ./simulation-logs/scenario-02-fastest.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-15s.yaml FastestConfigStrategy > ./simulation-logs/scenario-03-fastest.json

# # Cheapest ignores the SLO, so one scenario per input size is enough.
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-120s.yaml CheapestConfigStrategy > ./simulation-logs/scenario-01-cheapest.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-35s.yaml CheapestConfigStrategy > ./simulation-logs/scenario-02-cheapest.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-25s.yaml CheapestConfigStrategy > ./simulation-logs/scenario-03-cheapest.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-120s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-01-120s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-180s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-01-180s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-220s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-01-220s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-35s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-02-35s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-45s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-02-45s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-55s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-02-55s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-15s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-03-15s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-20s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-03-20s-slo-compliant.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-25s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-03-25s-slo-compliant.json

# ProportionalSloConfigStrategy doesn't work for this scenario, because it contains parallel execution.
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-120s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-01-120s-proportional-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-180s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-01-180s-proportional-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-220s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-01-220s-proportional-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-35s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-02-35s-proportional-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-45s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-02-45s-proportional-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-55s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-02-55s-proportional-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-15s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-03-15s-proportional-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-20s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-03-20s-proportional-slo.json
# node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-25s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-03-25s-proportional-slo.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-120s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-01-120s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-180s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-01-180s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-220s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-01-220s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-35s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-02-35s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-45s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-02-45s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-55s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-02-55s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-15s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-03-15s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-20s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-03-20s-proportional-critical-path-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-25s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-03-25s-proportional-critical-path-slo.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-120s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-120s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-180s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-180s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-220s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-220s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-35s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-35s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-45s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-45s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-55s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-55s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-15s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-15s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-20s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-20s-input-heuristic-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-25s.yaml InputHeuristicProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-25s-input-heuristic-proportional-cp-slo.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-120s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-120s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-180s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-180s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-220s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-01-220s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-35s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-35s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-45s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-45s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-55s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-02-55s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-15s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-15s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-20s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-20s-fixed-output-proportional-cp-slo.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-25s.yaml FixedOutputProportionalCPSloConfigStrategy > ./simulation-logs/scenario-03-25s-fixed-output-proportional-cp-slo.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-120s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-01-120s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-180s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-01-180s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-220s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-01-220s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-35s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-02-35s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-45s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-02-45s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-55s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-02-55s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-15s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-03-15s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-20s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-03-20s-input-heuristic.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-25s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-03-25s-input-heuristic.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-120s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-01-120s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-180s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-01-180s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-220s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-01-220s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-35s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-02-35s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-45s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-02-45s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-55s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-02-55s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-15s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-03-15s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-20s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-03-20s-fixed-input.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-25s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-03-25s-fixed-input.json

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-120s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-01-120s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-180s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-01-180s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-220s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-01-220s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-35s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-02-35s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-45s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-02-45s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02-55s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-02-55s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-15s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-03-15s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-20s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-03-20s-step-conf.json
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03-25s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-03-25s-step-conf.json

node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-01-120s.yaml > ./simulation-logs/scenario-01-120s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-01-180s.yaml > ./simulation-logs/scenario-01-180s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-01-220s.yaml > ./simulation-logs/scenario-01-220s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-02-35s.yaml > ./simulation-logs/scenario-02-35s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-02-45s.yaml > ./simulation-logs/scenario-02-45s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-02-55s.yaml > ./simulation-logs/scenario-02-55s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-03-15s.yaml > ./simulation-logs/scenario-03-15s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-03-20s.yaml > ./simulation-logs/scenario-03-20s-slam.json
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-03-25s.yaml > ./simulation-logs/scenario-03-25s-slam.json

# # Convert the results to CSV
node ../../dist/packages/results-converter/main.js ./simulation-logs ./simulation-results.csv
