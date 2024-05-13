#!/bin/bash
# set -x

# baseSlo = fastest(scenario-01) + (cheapest(scenario-01) - fastest(scenario(01)) / 2
SLO_STEP_PERCENT=1
RET=""

WORKFLOW_PATH="workflow"
OUTPUT_DIR="./simulation-logs"
RESULTS_CSV="./simulation-results"
TRAINING_SCENARIO_PATH="slam-scenario.yaml"

PROFILES_TYPE="" # Set by first command line argument. Can be "gcf", "aws", or "aws-bo".

CHUNK_FUNC_SIM_JS="../../dist/packages/chunk-func-sim/main.js"
RESULTS_CONVERTER_JS="../../dist/packages/results-converter/main.js"

SLO_TYPES=(
    "MaxExecutionTime"
    "MaxCost"
)

declare -A BASE_SLOS=(
    ["gcf-MaxExecutionTime"]=5307604
    ["aws-MaxExecutionTime"]=1729186
    ["aws-bo-MaxExecutionTime"]=1729186

    ["gcf-MaxCost"]=""
    ["aws-MaxCost"]="0.0899554999999999985"
    ["aws-bo-MaxCost"]="0.0899554999999999985"
)

declare -A SLO_RANGES_PERCENT=(
    ["gcf-MaxExecutionTime"]=40
    ["aws-MaxExecutionTime"]=35
    ["aws-bo-MaxExecutionTime"]=35

    ["gcf-MaxCost"]=40
    ["aws-MaxCost"]=40
    ["aws-bo-MaxCost"]=40
)

declare -A SCENARIOS=(
    ["scenario-01"]="scenario-01-template.yaml"
    ["scenario-02"]="scenario-02-template.yaml"
    ["scenario-03"]="scenario-03-template.yaml"
)

declare -A CONFIG_STRATEGIES=(
    ["proportional-critical-path-slo"]="ProportionalCriticalPathSloConfigStrategy"
    ["step-conf"]="StepConfConfigStrategy"
    # ["spread-search"]="SpreadSearchConfigStrategy"
    # ["hybrid-search"]="HybridSearchConfigStrategy"
)

declare -A CONFIG_STRATEGIES_WITH_TRAINING=(
    ["slam"]="SlamConfigStrategy"
    # ["online-slam"]="OnlineSlamConfigStrategy"
)

declare -A CMD_LINE_ARGUMENTS=(
    ["spread-search"]="--estimateMultiplier 1.0 --safetyMargin 0.01 --profileIncrements 1"
    ["hybrid-search"]="--estimateMultiplier 1.0 --safetyMargin 0.01 --profileIncrements 1"
)

# Writes the scenario YAML with the specified sloType and sloLimit to a temp file.
function writeScenarioYaml() {
    local scenarioTemplateFile=$1
    local sloType=$2
    local sloLimit=$3

    local scenarioFinalYamlFile="$(mktemp)"
    local scenarioYaml=$(sed -e "s/{{ \.sloType }}/${sloType}/" "$scenarioTemplateFile")
    sed -e "s/{{ \.sloLimit }}/${sloLimit}/" <<< "$scenarioYaml" > "$scenarioFinalYamlFile"

    RET=$scenarioFinalYamlFile
}

# Executes simulations for the SLO-independent strategies, i.e., fastest and cheapest.
function runSloIndependentStrategies() {
    local scenarioName=$1
    local scenarioTemplateFile=$2

    writeScenarioYaml "$scenarioTemplateFile" "MaxExecutionTime" 100
    local scenarioFinalYamlFile=$RET

    node "$CHUNK_FUNC_SIM_JS" "$WORKFLOW_PATH" "$scenarioFinalYamlFile" "FastestConfigStrategy" > "${OUTPUT_DIR}/${scenarioName}-${PROFILES_TYPE}-fastest.json"
    node "$CHUNK_FUNC_SIM_JS" "$WORKFLOW_PATH" "$scenarioFinalYamlFile" "CheapestConfigStrategy" > "${OUTPUT_DIR}/${scenarioName}-${PROFILES_TYPE}-cheapest.json"

    rm "$scenarioFinalYamlFile"
}

# Executes the SLO-dependent strategies.
function runSloStrategies() {
    local scenarioName=$1
    local scenarioTemplateFile=$2
    local sloType=$3
    local sloLimit=$4

    writeScenarioYaml "$scenarioTemplateFile" "$sloType" "$sloLimit"
    local scenarioFinalYamlFile=$RET

    for configStratKey in "${!CONFIG_STRATEGIES[@]}"; do
        local configStrat=${CONFIG_STRATEGIES[$configStratKey]}
        local cmdLineArgs=${CMD_LINE_ARGUMENTS[$configStratKey]}
        echo "Running $configStrat $cmdLineArgs with SLO: $sloLimit"
        node "$CHUNK_FUNC_SIM_JS" "$WORKFLOW_PATH" "$scenarioFinalYamlFile" "$configStrat" $cmdLineArgs > "${OUTPUT_DIR}/${scenarioName}-${configStratKey}-${sloLimit}.json"
    done

    for configStratKey in "${!CONFIG_STRATEGIES_WITH_TRAINING[@]}"; do
        local configStrat=${CONFIG_STRATEGIES_WITH_TRAINING[$configStratKey]}
        local cmdLineArgs=${CMD_LINE_ARGUMENTS[$configStratKey]}
        echo "Running $configStrat $cmdLineArgs with SLO: $sloLimit"
        node "$CHUNK_FUNC_SIM_JS" "$WORKFLOW_PATH" "$scenarioFinalYamlFile" "$configStrat" "$TRAINING_SCENARIO_PATH" $cmdLineArgs > "${OUTPUT_DIR}/${scenarioName}-${configStratKey}-${sloLimit}.json"
    done

    rm "$scenarioFinalYamlFile"
}

# Simulates the SLO range (baseSlo, baseSlo +/- sloRangePercent]
# The + or - is determined by the $multiplier parameter.
function simulateSloRange() {
    local scenarioName=$1
    local scenarioTemplateFile=$2
    local sloType=$3
    local baseSlo=$4
    local sloRangePercent=$5
    local multiplier=$6

    local onePercent=""
    # We use floating point division only if the baseSlo is already a floating point number.
    if [[ "$baseSlo" == *"."* ]]; then
        onePercent=$(echo "$baseSlo/100" | bc -l)
    else
        onePercent=$((baseSlo/100))
    fi

    for ((i=$SLO_STEP_PERCENT; i<=$sloRangePercent; i=i+SLO_STEP_PERCENT)); do
        local sloLimit=$(echo "$baseSlo+$onePercent*$i*$multiplier" | bc -l)
        runSloStrategies "$scenarioName" "$scenarioTemplateFile" "$sloType" "$sloLimit"
    done
}

# Simulates a scenario with all strategies.
function simulateScenario() {
    local scenarioName=$1
    local sloType=$2
    local baseSlo=$3
    local sloRangePercent=$4
    local scenarioTemplateFile=${SCENARIOS[$scenarioName]}

    runSloIndependentStrategies "$scenarioName" "$scenarioTemplateFile"

    runSloStrategies "$scenarioName" "$scenarioTemplateFile" "$sloType" "$baseSlo"
    simulateSloRange "$scenarioName" "$scenarioTemplateFile" "$sloType" "$baseSlo" "$sloRangePercent" "-1"
    simulateSloRange "$scenarioName" "$scenarioTemplateFile" "$sloType" "$baseSlo" "$sloRangePercent" "1"
}

function convertResultsToCsv() {
    local outputDir=$1
    local resultsCsv=$2

    echo "Converting results and storing them in $resultsCsv"
    node "$RESULTS_CONVERTER_JS" "$outputDir" "$resultsCsv"

    # Sort the CSV by strategy, scenario, and SLO
    sortedCsv=$(head -n 1 "$resultsCsv" && tail -n +2 "$resultsCsv" | sort -t "," -k 1,1d -k 2,2h -k 3,3n)
    echo "$sortedCsv" > "$resultsCsv"

    echo "Removing all JSON files from output directory"
    rm "$outputDir/"*.json
}

function simulateScenarios() {
    local sloConfigKey=""
    local baseSlo=""
    local sloRangePercent=""

    echo "Simulating scenarios ..."
    for currSloType in "${SLO_TYPES[@]}"; do
        sloConfigKey="$PROFILES_TYPE-$currSloType"
        baseSlo=${BASE_SLOS[${sloConfigKey}]}
        sloRangePercent=${SLO_RANGES_PERCENT[${sloConfigKey}]}

        for scenarioKey in "${!SCENARIOS[@]}"; do
            simulateScenario "$scenarioKey" "$currSloType" "$baseSlo" "$sloRangePercent"
        done

        local resultsCsv="${RESULTS_CSV}-${PROFILES_TYPE}-${currSloType}.csv"
        convertResultsToCsv "$OUTPUT_DIR" "$resultsCsv"
    done
}


if [ "$1" != "aws" ] && [ "$1" != "aws-bo" ] && [ "$1" != "gcf" ]; then
    echo "Usage: ./run-all-range.sh <profiles-type>"
    echo "profiles-type can be \"aws\", \"aws-bo\", or \"gcf\""
    echo "Example: ./run-all-range.sh gcf"
    exit 1
fi

PROFILES_TYPE=$1
WORKFLOW_PATH="${WORKFLOW_PATH}-${PROFILES_TYPE}.yaml"

mkdir -p "$OUTPUT_DIR"

echo "Removing all JSON files from output directory"
rm "$OUTPUT_DIR/"*.json

simulateScenarios

