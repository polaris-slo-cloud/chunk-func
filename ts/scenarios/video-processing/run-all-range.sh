#!/bin/bash
# set -x

BASE_SLO_MS=79000
SLO_RANGE_PERCENT=40
SLO_STEP_PERCENT=1

WORKFLOW_PATH="workflow.yaml"
OUTPUT_DIR="./simulation-logs"
RESULTS_CSV="./simulation-results.csv"
TRAINING_SCENARIO_PATH="slam-scenario.yaml"

CHUNK_FUNC_SIM_JS="../../dist/packages/chunk-func-sim/main.js"
RESULTS_CONVERTER_JS="../../dist/packages/results-converter/main.js"

declare -A SCENARIOS=(
    ["scenario-01"]="scenario-01-template.yaml"
    ["scenario-02"]="scenario-02-template.yaml"
    ["scenario-03"]="scenario-03-template.yaml"
)

declare -A CONFIG_STRATEGIES=(
    ["proportional-critical-path-slo"]="ProportionalCriticalPathSloConfigStrategy"
    ["step-conf"]="StepConfConfigStrategy"
    ["spread-search"]="SpreadSearchConfigStrategy"
)

declare -A CONFIG_STRATEGIES_WITH_TRAINING=(
    ["slam"]="SlamConfigStrategy"
    ["online-slam"]="OnlineSlamConfigStrategy"
)

declare -A CMD_LINE_ARGUMENTS=(
    ["spread-search"]="--estimateMultiplier 1.0 --safetyMargin 0.01 --profileIncrements 1"
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
        local cmdLineArgs=${CMD_LINE_ARGUMENTS[$configStratKey]}
        echo "Running $configStrat $cmdLineArgs with SLO: $sloMs"
        node "$CHUNK_FUNC_SIM_JS" "$WORKFLOW_PATH" "$scenarioFinalYamlFile" "$configStrat" $cmdLineArgs > "${OUTPUT_DIR}/${scenarioName}-${configStratKey}-${sloMs}.json"
    done

    for configStratKey in "${!CONFIG_STRATEGIES_WITH_TRAINING[@]}"; do
        local configStrat=${CONFIG_STRATEGIES_WITH_TRAINING[$configStratKey]}
        local cmdLineArgs=${CMD_LINE_ARGUMENTS[$configStratKey]}
        echo "Running $configStrat $cmdLineArgs with SLO: $sloMs"
        node "$CHUNK_FUNC_SIM_JS" "$WORKFLOW_PATH" "$scenarioFinalYamlFile" "$configStrat" "$TRAINING_SCENARIO_PATH" $cmdLineArgs > "${OUTPUT_DIR}/${scenarioName}-${configStratKey}-${sloMs}.json"
    done

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

# Sort the CSV by strategy, scenario, and SLO
sortedCsv=$(head -n 1 "$RESULTS_CSV" && tail -n +2 "$RESULTS_CSV" | sort -t "," -k 1,1d -k 2,2h -k 3,3n)
echo "$sortedCsv" > "$RESULTS_CSV"
