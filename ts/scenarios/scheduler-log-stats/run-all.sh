#!/bin/bash
set -x

# Fastest ignores the SLO, so one scenario per input size is enough.
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-11s.yaml FastestConfigStrategy > ./simulation-logs/scenario-01-fastest.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02.yaml FastestConfigStrategy > ./simulation-logs/scenario-02-fastest.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03.yaml FastestConfigStrategy > ./simulation-logs/scenario-03-fastest.log

# Cheapest ignores the SLO, so one scenario per input size is enough.
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-11s.yaml CheapestConfigStrategy > ./simulation-logs/scenario-01-cheapest.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02.yaml CheapestConfigStrategy > ./simulation-logs/scenario-02-cheapest.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03.yaml CheapestConfigStrategy > ./simulation-logs/scenario-03-cheapest.log

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-11s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-01-11s-slo-compliant.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-12s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-01-12s-slo-compliant.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-13s.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-01-13s-slo-compliant.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-02-slo-compliant.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-03-slo-compliant.log

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-11s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-01-11s-proportional-slo.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-12s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-01-12s-proportional-slo.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-13s.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-01-13s-proportional-slo.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-02-proportional-slo.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-03-proportional-slo.log

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-11s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-01-11s-proportional-critical-path-slo.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-12s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-01-12s-proportional-critical-path-slo.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-13s.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-01-13s-proportional-critical-path-slo.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-02-proportional-critical-path-slo.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03.yaml ProportionalCriticalPathSloConfigStrategy > ./simulation-logs/scenario-03-proportional-critical-path-slo.log

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-11s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-01-11s-input-heuristic.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-12s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-01-12s-input-heuristic.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-13s.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-01-13s-input-heuristic.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-02-input-heuristic.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-03-input-heuristic.log

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-11s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-01-11s-fixed-input.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-12s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-01-12s-fixed-input.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-13s.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-01-13s-fixed-input.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-02-fixed-input.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-03-fixed-input.log

node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-11s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-01-11s-step-conf.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-12s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-01-12s-step-conf.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-01-13s.yaml StepConfConfigStrategy > ./simulation-logs/scenario-01-13s-step-conf.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-02.yaml StepConfConfigStrategy > ./simulation-logs/scenario-02-step-conf.log
node ../../dist/packages/chunk-func-sim/main.js workflow.yaml scenario-03.yaml StepConfConfigStrategy > ./simulation-logs/scenario-03-step-conf.log

node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-01-11s.yaml > ./simulation-logs/scenario-01-11s-slam.log
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-01-12s.yaml > ./simulation-logs/scenario-01-12s-slam.log
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-01-13s.yaml > ./simulation-logs/scenario-01-13s-slam.log
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-02.yaml > ./simulation-logs/scenario-02-slam.log
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-03.yaml > ./simulation-logs/scenario-03-slam.log
