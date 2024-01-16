#!/bin/bash
# set -x

BASE_SLO_MS=79000
SLO_RANGE_PERCENT=40
SLO_STEP_PERCENT=1

WORKFLOW_PATH="workflow.yaml"
RESULTS_CSV="./spread-search-options.csv"

CHUNK_FUNC_SIM_JS="../../dist/packages/chunk-func-sim/main.js"

declare -A SCENARIOS=(
    ["scenario-01"]="scenario-01-template.yaml"
    # ["scenario-02"]="scenario-02-template.yaml"
    # ["scenario-03"]="scenario-03-template.yaml"
)

ESTIMATE_MULTIPLIERS=("1.0" "1.1" "1.2" "1.3" "1.4" "1.5" "1.6" "1.7" "1.8" "1.9" "2.0")
SAFETY_MARGINS=("0.01" "0.02" "0.03" "0.04" "0.05" "0.06" "0.07" "0.08" "0.09" "0.1" "0.11" "0.12" "0.13" "0.14" "0.15" "0.16" "0.17" "0.18" "0.19" "0.2")
PROFILE_INCREMENTS=("1" "2" "3")

# Evaluates the scenario with the specified SpreadSearch options.
# Sets `$ret` to the total cost, if the SLO is fulfilled or to `-1` if the SLO is not fulfilled.
function evaluateScenario() {
    local scenarioName=$1
    local scenarioTemplateFile=$2
    local sloMs=$3
    local estimateMultiplier=$4
    local safetyMargin=$5
    local profileIncrements=$6

    local scenarioFinalYamlFile="$(mktemp)"
    sed -e "s/{{ \.sloMs }}/${sloMs}/" "$scenarioTemplateFile" > "$scenarioFinalYamlFile"

    # echo "Running SLO $sloMs with estimateMultiplier=$estimateMultiplier, safetyMargin=$safetyMargin, profileIncrements=$profileIncrements"
    local output=$(node "$CHUNK_FUNC_SIM_JS" "$WORKFLOW_PATH" "$scenarioFinalYamlFile" "SpreadSearchConfigStrategy" --estimateMultiplier $estimateMultiplier --safetyMargin $safetyMargin --profileIncrements $profileIncrements)
    rm "$scenarioFinalYamlFile"

    local sloFulfilled=$(jq ".sloFulfilled" <<< "$output")
    if [ "$sloFulfilled" == "true" ]; then
        ret=$(jq ".workflowOutput.totalCost" <<< "$output")
    else
        ret=-1
    fi
}

# Simulates the SLO range (BASE_SLO_MS, BASE_SLO_MS +/- SLO_RANGE_PERCENT] and returns the average cost for an execution.
# Sets `$ret` to the average cost achieved over the SLO range, if all SLOs were fulfilled.
# Sets `$ret` to `-1`, if not all SLOs were fulfilled.
function computeAvgCostForSloRange() {
    local scenarioName=$1
    local scenarioTemplateFile=${SCENARIOS[$scenarioName]}
    local estimateMultiplier=$2
    local safetyMargin=$3
    local profileIncrements=$4

    echo "Evaluating estimateMultiplier=$estimateMultiplier, safetyMargin=$safetyMargin, profileIncrements=$profileIncrements"

    local onePercent=$((BASE_SLO_MS/100))
    local totalCost=0
    local iterationsCount=0
    local start=$((SLO_RANGE_PERCENT*-1))
    for ((i=$start; i<=$SLO_RANGE_PERCENT; i=i+SLO_STEP_PERCENT)); do
        local sloMs=$((BASE_SLO_MS+onePercent*i))
        evaluateScenario "$scenarioName" "$scenarioTemplateFile" "$sloMs" "$estimateMultiplier" "$safetyMargin" "$profileIncrements"

        if [ "$ret" == "-1" ]; then
            echo "SLO not fulfilled: $sloMs Changing to next configuration."
            return 0
        fi
        totalCost=$(echo "$totalCost+$ret" | bc -l)
        ((iterationsCount++))
    done

    # Calculate the average cost.
    ret=$(echo "$totalCost/$iterationsCount" | bc -l)
    echo "Calulating avgCost: $totalCost / $iterationsCount = $ret"
}

# Simulates a scenario with all SpreadSearch options.
function simulateScenario() {
    local scenarioName=$1

    for estimateMult in "${ESTIMATE_MULTIPLIERS[@]}"; do
        for safetyM in "${SAFETY_MARGINS[@]}"; do
            for profileInc in "${PROFILE_INCREMENTS[@]}"; do
                computeAvgCostForSloRange "$scenarioName" "$estimateMult" "$safetyM" "$profileInc"
                echo "$scenarioName,$estimateMult,$safetyM,$profileInc,$ret" >> "$RESULTS_CSV"
            done
        done
    done
}


mkdir -p "$OUTPUT_DIR"

# Write the CSV header
echo "scenario,estimateMultiplier,safetyMargin,profileIncrements,avgCost" > "$RESULTS_CSV"

echo "Simulating scenarios ..."
for scenarioKey in "${!SCENARIOS[@]}"; do
    simulateScenario "$scenarioKey"
done

# Sort the CSV by scenario, avgCost, and profile increments
sortedCsv=$(head -n 1 "$RESULTS_CSV" && tail -n +2 "$RESULTS_CSV" | sort -t "," -k 1,1d -k 5,5n -k 4,4n)
echo "$sortedCsv" > "$RESULTS_CSV"
