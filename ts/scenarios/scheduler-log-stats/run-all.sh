#!/bin/bash
set -x

node ../../dist/packages/simulator/main.js workflow.yaml scenario-01.yaml FastestConfigStrategy > ./simulation-logs/scenario-01-fastest.log
node ../../dist/packages/simulator/main.js workflow.yaml scenario-02.yaml FastestConfigStrategy > ./simulation-logs/scenario-02-fastest.log
node ../../dist/packages/simulator/main.js workflow.yaml scenario-03.yaml FastestConfigStrategy > ./simulation-logs/scenario-03-fastest.log

node ../../dist/packages/simulator/main.js workflow.yaml scenario-01.yaml CheapestConfigStrategy > ./simulation-logs/scenario-01-cheapest.log
node ../../dist/packages/simulator/main.js workflow.yaml scenario-02.yaml CheapestConfigStrategy > ./simulation-logs/scenario-02-cheapest.log
node ../../dist/packages/simulator/main.js workflow.yaml scenario-03.yaml CheapestConfigStrategy > ./simulation-logs/scenario-03-cheapest.log

node ../../dist/packages/simulator/main.js workflow.yaml scenario-01.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-01-slo-compliant.log
node ../../dist/packages/simulator/main.js workflow.yaml scenario-02.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-02-slo-compliant.log
node ../../dist/packages/simulator/main.js workflow.yaml scenario-03.yaml SloCompliantConfigStrategy > ./simulation-logs/scenario-03-slo-compliant.log

node ../../dist/packages/simulator/main.js workflow.yaml scenario-01.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-01-proportional-slo.log
node ../../dist/packages/simulator/main.js workflow.yaml scenario-02.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-02-proportional-slo.log
node ../../dist/packages/simulator/main.js workflow.yaml scenario-03.yaml ProportionalSloConfigStrategy > ./simulation-logs/scenario-03-proportional-slo.log

node ../../dist/packages/simulator/main.js workflow.yaml scenario-01.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-01-input-heuristic.log
node ../../dist/packages/simulator/main.js workflow.yaml scenario-02.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-02-input-heuristic.log
node ../../dist/packages/simulator/main.js workflow.yaml scenario-03.yaml InputHeuristicSloCompliantConfigStrategy > ./simulation-logs/scenario-03-input-heuristic.log

node ../../dist/packages/simulator/main.js workflow.yaml scenario-01.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-01-fixed-input.log
node ../../dist/packages/simulator/main.js workflow.yaml scenario-02.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-02-fixed-input.log
node ../../dist/packages/simulator/main.js workflow.yaml scenario-03.yaml FixedOutputSloCompliantConfigStrategy > ./simulation-logs/scenario-03-fixed-input.log

node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-01.yaml > ./simulation-logs/scenario-01-slam.log
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-02.yaml > ./simulation-logs/scenario-02-slam.log
node ../../dist/packages/slam/main.js workflow.yaml slam-scenario.yaml scenario-03.yaml > ./simulation-logs/scenario-03-slam.log
