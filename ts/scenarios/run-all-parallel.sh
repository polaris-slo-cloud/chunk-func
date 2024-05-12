#!/bin/bash
# set -x

SCENARIOS=(
    "./cyclic-workflow"
    "./face-detection"
    "./highres-lowres-workflow"
    "./homogeneous-workflow"
    # "./log-processing"
    "./long-short-workflow"
    "./lowres-highres-workflow"
    "./random-workflow"
    "./short-long-workflow"
    "./staircase-workflow"
    "./video-processing"
)

PROFILE_TYPES=(
    # "gcf"
    "aws"
    "aws-bo"
)

function runScenario() {
    local scenario=$1
    cd "$1"
    for profileType in "${PROFILE_TYPES[@]}"; do
        ./run-all-range.sh "$profileType"
    done
}

function runSimulations() {
    local pids=()
    local scenario=""

    local length=${#SCENARIOS[@]}
    for (( i=0; i<length; i++ ));
    do
        scenario=${SCENARIOS[${i}]}
        ( runScenario "$scenario" ) &
        pids[${i}]=$!
    done

    # Wait for all subshells to finish
    for pid in "${pids[@]}"; do
        wait $pid
    done
}

runSimulations
