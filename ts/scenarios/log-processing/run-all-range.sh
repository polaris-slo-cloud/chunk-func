#!/bin/bash
# set -x

BASE_SLO_MS=0 # fastest(scenario-01) + (cheapest(scenario-01) - fastest(scenario(01)) / 2
SLO_RANGE_PERCENT=15
SLO_STEP_PERCENT=1

WORKFLOW_PATH="workflow"
OUTPUT_DIR="./simulation-logs"
RESULTS_CSV="./simulation-results"
TRAINING_SCENARIO_PATH="slam-scenario.yaml"

PROFILES_TYPE="" # Set by first command line argument. Can be "gcf" or "aws".

CHUNK_FUNC_SIM_JS="../../dist/packages/chunk-func-sim/main.js"
RESULTS_CONVERTER_JS="../../dist/packages/results-converter/main.js"

declare -A BASE_SLOS=(
    ["gcf"]=12000

    # All AWS profiles have at least 1 vCPU, and Node.JS is single threaded, so there is not much difference between cheapest and fastest.
    # Actually this scenario does not make sense for AWS, because the fastest possible exec time is ~99.3% of the BASE_SLO.
    ["aws"]=1557
)

declare -A SCENARIOS=(
    ["scenario-01"]="scenario-01-template.yaml"
    ["scenario-02"]="scenario-02-template.yaml"
    ["scenario-03"]="scenario-03-template.yaml"
)

declare -A CONFIG_STRATEGIES=(
    ["proportional-critical-path-slo"]="ProportionalCriticalPathSloConfigStrategy"
    ["step-conf"]="StepConfConfigStrategy"
    ["spread-search"]="SpreadSearchConfigStrategy"
    ["hybrid-search"]="HybridSearchConfigStrategy"
)

declare -A CONFIG_STRATEGIES_WITH_TRAINING=(
    ["slam"]="SlamConfigStrategy"
    ["online-slam"]="OnlineSlamConfigStrategy"
)

declare -A CMD_LINE_ARGUMENTS=(
    ["spread-search"]="--estimateMultiplier 1.3 --safetyMargin 0.11 --profileIncrements 2"
    ["hybrid-search"]="--estimateMultiplier 1.3 --safetyMargin 0.11 --profileIncrements 2"
)

# Executes simulations for the SLO-independent strategies, i.e., fastest and cheapest.
function runSloIndependentStrategies() {
    local scenarioName=$1
    local scenarioTemplateFile=$2

    local scenarioFinalYamlFile="$(mktemp)"
    sed -e "s/{{ \.sloMs }}/100/" "$scenarioTemplateFile" > "$scenarioFinalYamlFile"

    node "$CHUNK_FUNC_SIM_JS" "$WORKFLOW_PATH" "$scenarioFinalYamlFile" "FastestConfigStrategy" > "${OUTPUT_DIR}/${scenarioName}-${PROFILES_TYPE}-fastest.json"
    node "$CHUNK_FUNC_SIM_JS" "$WORKFLOW_PATH" "$scenarioFinalYamlFile" "CheapestConfigStrategy" > "${OUTPUT_DIR}/${scenarioName}-${PROFILES_TYPE}-cheapest.json"

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


if [ "$1" != "aws" ] && [ "$1" != "gcf" ]; then
    echo "Usage: ./run-all-range.sh <profiles-type>"
    echo "profiles-type can be \"aws\" or \"gcf\""
    echo "Example: ./run-all-range.sh gcf"
    exit 1
fi

PROFILES_TYPE=$1
WORKFLOW_PATH="${WORKFLOW_PATH}-${PROFILES_TYPE}.yaml"
RESULTS_CSV="${RESULTS_CSV}-${PROFILES_TYPE}.csv"
BASE_SLO_MS=${BASE_SLOS[${PROFILES_TYPE}]}

mkdir -p "$OUTPUT_DIR"

echo "Removing all JSON files from output directory"
rm "$OUTPUT_DIR/"*.json

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