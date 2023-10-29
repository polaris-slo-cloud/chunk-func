#!/bin/bash
# set -x

BASE_SLO_MS=79000
SLO_RANGE_PERCENT=25
SLO_STEP_PERCENT=1

WORKFLOW_PATH="workflow.yaml"
OUTPUT_DIR="./simulation-logs"
RESULTS_CSV="./simulation-results.csv"
SLAM_SCENARIO_PATH="slam-scenario.yaml"

CHUNK_FUNC_SIM_JS="../../dist/packages/chunk-func-sim/main.js"
SLAM_SIM_JS="../../dist/packages/slam/main.js"
RESULTS_CONVERTER_JS="../../dist/packages/results-converter/main.js"

declare -A SCENARIOS=(
    ["scenario-01"]="scenario-01-template.yaml"
    ["scenario-02"]="scenario-02-template.yaml"
    ["scenario-03"]="scenario-03-template.yaml"
)

declare -A CONFIG_STRATEGIES=(
    ["proportional-critical-path-slo"]="ProportionalCriticalPathSloConfigStrategy"
    ["step-conf"]="StepConfConfigStrategy"
)

# Executes simulations for the SLO-independent strategies, i.e., fastest and cheapest.
function runSloIndependentStrategies() {
    local scenarioName=$1
    local scenarioTemplateFile=$2

    local scenarioFinalYamlFile="$(mktemp)"
    sed -e "s/{{ \.sloMs }}/100/" "$scenarioTemplateFile" > "$scenarioFinalYamlFile"

    node "$CHUNK_FUNC_SIM_JS" "$WORKFLOW_PATH" "$scenarioFinalYamlFile" "FastestConfigStrategy" > "${OUTPUT_DIR}/${scenarioName}-fastest.json"
    node "$CHUNK_FUNC_SIM_JS" "$WORKFLOW_PATH" "$scenarioFinalYamlFile" "CheapestConfigStrategy" > "${OUTPUT_DIR}/${scenarioName}-cheapest.json"

    rm "$scenarioFinalYamlFile"
}

# Executes the SLO-dependent strategies.
function runSloStrategies() {
    local scenarioName=$1
    local scenarioTemplateFile=$2
    local sloMs=$3

    local scenarioFinalYamlFile="$(mktemp)"
    sed -e "s/{{ \.sloMs }}/${sloMs}/" "$scenarioTemplateFile" > "$scenarioFinalYamlFile"

    for configStratKey in "${!CONFIG_STRATEGIES[@]}"; do
        local configStrat=${CONFIG_STRATEGIES[$configStratKey]}
        echo "Running $configStrat with SLO: $sloMs"
        node "$CHUNK_FUNC_SIM_JS" "$WORKFLOW_PATH" "$scenarioFinalYamlFile" "$configStrat" > "${OUTPUT_DIR}/${scenarioName}-${configStratKey}-${sloMs}.json"
    done

    echo "Running SLAM with SLO: $sloMs"
    node "$SLAM_SIM_JS" "$WORKFLOW_PATH" "$SLAM_SCENARIO_PATH" "$scenarioFinalYamlFile" > "${OUTPUT_DIR}/${scenarioName}-slam-${sloMs}.json"

    rm "$scenarioFinalYamlFile"
}

# Simulates the SLO range (BASE_SLO_MS, BASE_SLO_MS +/- SLO_RANGE_PERCENT]
# The + or - is determined by the $multiplier parameter.
function simulateSloRange() {
    local scenarioName=$1
    local scenarioTemplateFile=${SCENARIOS[$scenarioName]}
    local multiplier=$3

    local onePercent=$((BASE_SLO_MS/100))
    for ((i=$SLO_STEP_PERCENT; i<=$SLO_RANGE_PERCENT; i=i+SLO_STEP_PERCENT)); do
        local sloMs=$((BASE_SLO_MS+onePercent*i*multiplier))
        runSloStrategies "$scenarioName" "$scenarioTemplateFile" "$sloMs"
    done
}

# Simulates a scenario with all strategies.
function simulateScenario() {
    local scenarioName=$1
    local scenarioTemplateFile=${SCENARIOS[$scenarioName]}

    runSloIndependentStrategies "$scenarioName" "$scenarioTemplateFile"

    runSloStrategies "$scenarioName" "$scenarioTemplateFile" "$BASE_SLO_MS"
    simulateSloRange "$scenarioName" "$scenarioTemplateFile" "-1"
    simulateSloRange "$scenarioName" "$scenarioTemplateFile" "1"
}


mkdir -p "$OUTPUT_DIR"

echo "Simulating scenarios ..."
for scenarioKey in "${!SCENARIOS[@]}"; do
    simulateScenario "$scenarioKey"
done

# Convert the results to CSV
echo "Converting results and storing them in $RESULTS_CSV"
node "$RESULTS_CONVERTER_JS" "$OUTPUT_DIR" "$RESULTS_CSV"
