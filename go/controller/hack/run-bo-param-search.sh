#!/bin/bash
# set -x
# set -o errexit
set -m

# This script runs a parameter search for the Bayesian Optimization XI value.

OUTPUT_FOLDER="results"

FUNCTION_DESCRIPTIONS=(
    # LogPro
    "validate-log"
    "extract-basic-stats"
    "extract-successes"
    "extract-success-stats"

    # VidPro
    "validate-video"
    "cut-video"
    "merge-videos"

    # Face detection
    "validate-video-face-recog"
    "detect-faces"
    "mark-faces"
    "transform-video"
)

FUNCTION_DESCRIPTION_FOLDERS=(
    "../config/samples/face-detection"
    "../config/samples/scheduler-log-stats"
    "../config/samples/video-processing"
)

XI_VALUES=("0.01" "0.05" "0.1" "0.5" "1.0" "1.5" "2.0" "2.5" "3.0")

FUNC_DESC_CRD="functiondescriptions.chunk-func.polaris-slo-cloud.github.io"
FUNC_NAMESPACE="func-test"
CONTROLLER_NAMESPACE="chunk-func-controller-system"
CONTROLLER_DEPLOYMENT_NAME="chunk-func-controller-controller-manager"

SLEEP_DURATION="1m"

# Generate the base deployment YAML for the controller with the BO configuration.
controllerBaseYaml=$(kubectl kustomize ../config/default)
controllerBaseYaml=$(awk -v RS= "{print gensub(/(name: PROFILER\n\s+value: )(\w+)/, \"\\\\1BayesianOpt\", \"g\");}" <<< "$controllerBaseYaml")
controllerBaseYaml=$(awk -v RS= "{print gensub(/(name: FUNCTION_TRIGGER\n\s+value: )(\w+)/, \"\\\\1MockedResults\", \"g\");}" <<< "$controllerBaseYaml")
controllerBaseYaml=$(awk -v RS= "{print gensub(/(name: ITERATIONS_PER_CONFIGURATION\n\s+value: )(['\"][0-9\.]+['\"])/, \"\\\\1'1'\", \"g\");}" <<< "$controllerBaseYaml")

# Used for recording which funcDescs have already been profiled in an iteration.
declare -A profiledFuncs

# Deploys the chunk-func controller with $1 being the BO XI parameter
function deployController() {
    local xi=$1
    echo "Deploying controller with xi=$xi"
    local controllerYaml=$(awk -v RS= "{print gensub(/(name: BAYESIAN_OPT_XI\n\s+value: )(['\"][0-9\.]+['\"])/, \"\\\\1'${xi}'\", \"g\");}" <<< "$controllerBaseYaml")
    kubectl apply -f - <<< "$controllerYaml"
}

# Deploys all function descriptions.
function deployFuncDescs() {
    for folder in "${FUNCTION_DESCRIPTION_FOLDERS[@]}"; do
        kubectl apply -f "$folder"
    done
    for funcName in "${FUNCTION_DESCRIPTIONS[@]}"; do
        profiledFuncs[$funcName]=false
    done
}

# Deletes the controller and all function descriptions.
function cleanUp() {
    kubectl delete deployment --ignore-not-found=true -n $CONTROLLER_NAMESPACE $CONTROLLER_DEPLOYMENT_NAME
    for funcName in "${FUNCTION_DESCRIPTIONS[@]}"; do
        kubectl delete $FUNC_DESC_CRD --ignore-not-found=true -n $FUNC_NAMESPACE $funcName
    done
}

# Repeatedly checks which function have been profiled and returns when all have been profiled.
function waitForAllResults() {
    local doneCount=0
    while [ "$doneCount" -ne ${#FUNCTION_DESCRIPTIONS} ]; do
        doneCount=0
        echo "Sleeping $SLEEP_DURATION"
        sleep $SLEEP_DURATION

        for funcName in "${!profiledFuncs[@]}"; do
            if [ "${profiledFuncs[$funcName]}" = true ]; then
                doneCount=$(( $doneCount+1 ))
                continue
            fi

            local profilingDuration=$(kubectl get $FUNC_DESC_CRD -n $FUNC_NAMESPACE $funcName -o jsonpath='{.status.profilingResults.profilingDurationSeconds}')
            if [ "$profilingDuration" != "" ]; then
                profiledFuncs[$funcName]=true
                doneCount=$(( $doneCount+1 ))
                echo "$funcName successfully profiled"
            fi
        done

        echo "$doneCount of ${#FUNCTION_DESCRIPTIONS} profiled"
    done
}

# Exports all func descs to the folder specified in $1
function exportResults() {
    local destFolder=$1
    mkdir -p "$destFolder"
    for funcName in "${FUNCTION_DESCRIPTIONS[@]}"; do
        kubectl get $FUNC_DESC_CRD -n $FUNC_NAMESPACE $funcName -o yaml > "$destFolder/$funcName.yaml"
    done
}


# Ensure that there are no objects left over from previous experiments.
cleanUp

for boXi in "${XI_VALUES[@]}"; do
    deployController "$boXi"
    deployFuncDescs
    waitForAllResults
    exportResults "./$OUTPUT_FOLDER/xi=$boXi"
    cleanUp
done
