#!/bin/bash
# set -x
# set -o errexit
set -m

FUNCTION_DESCRIPTIONS=(
    "cut-video"
    "validate-video"
    "detect-faces"
    "mark-faces"
    "validate-video-face-recog"
    "transform-video"
    "validate-log"
    "extract-successes"
    "merge-videos"
    "extract-basic-stats"
    "extract-success-stats"
)

NAMESPACE="func-test"

for funcName in "${FUNCTION_DESCRIPTIONS[@]}"; do
    kubectl get functiondescriptions.chunk-func.polaris-slo-cloud.github.io -n ${NAMESPACE} ${funcName} -o yaml > ./${funcName}.yaml
done
