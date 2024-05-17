#!/bin/bash
# set -x

MAX_PARALLEL=8

SCENARIOS=(
    "./cyclic-workflow"
    "./face-detection"
    "./highres-lowres-workflow"
    "./homogeneous-workflow"
    # "./log-processing"
    "./lowres-highres-workflow"
    "./random-workflow"
    "./staircase-workflow"
    "./video-processing"
)

PROFILE_TYPES=(
    "gcf"
    "aws"
    "aws-bo"
)

PIDS=()

function runScenario() {
    local scenario=$1
    cd "$1"
    for profileType in "${PROFILE_TYPES[@]}"; do
        echo "$scenario $profileType"
        ./run-all-range.sh "$profileType"
    done
}

function waitForSubshells() {
    # Wait for all subshells to finish
    for pid in "${PIDS[@]}"; do
        wait $pid
    done
    PIDS=()
}

function runSimulations() {
    local scenario=""

    local length=${#SCENARIOS[@]}
    for (( i=0; i<length; i++ ));
    do
        scenario=${SCENARIOS[${i}]}
        ( runScenario "$scenario" ) &
        PIDS[${i}]=$!

        echo "PIDS count ${#PIDS[@]}"
        if [[ ${#PIDS[@]} -eq $MAX_PARALLEL ]]; then
            waitForSubshells
        fi
    done

    waitForSubshells
}

runSimulations
