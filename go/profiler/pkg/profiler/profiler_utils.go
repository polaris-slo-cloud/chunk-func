package profiler

import (
	"fmt"
	"slices"
	"strings"

	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
)

// Aggregates individual (successful) profiling results for a single resource profile and single input size into one result.
// If there are no successful results, an error is returned.
func AggregateProfilingResults(results []*function.ProfilingResult) (*function.ProfilingResult, error) {
	if len(results) == 0 {
		return nil, fmt.Errorf("AggregateProfilingResults failed, because results are empty")
	}

	successfulResults := 0
	var successStatusCode int32
	var totalTimeMs int64 = 0
	for _, result := range results {
		if function.IsSuccessStatusCode(result.StatusCode) {
			successStatusCode = result.StatusCode
			successfulResults++
			totalTimeMs += result.ExecutionTimeMs
		}
	}

	if successfulResults == 0 {
		// If all requests resulted in an error, return one of the error results
		return results[0], nil
	}

	ret := &function.ProfilingResult{
		StatusCode:      successStatusCode,
		InputSizeBytes:  results[0].InputSizeBytes,
		ExecutionTimeMs: totalTimeMs / int64(successfulResults),
	}
	return ret, nil
}

// Sorts the specified results by increasing input size.
func sortProfilingResultsByInputSize(results []*function.ProfilingResult) {
	slices.SortFunc(results, func(a, b *function.ProfilingResult) int { return int(a.InputSizeBytes - b.InputSizeBytes) })
}

// Copies the results with a success status code to a new slice and returns that slice.
// If none of the results have a success status code, the returned slice will be empty.
func copyAndPruneResults(results []*function.ProfilingResult) []*function.ProfilingResult {
	dest := make([]*function.ProfilingResult, 0, len(results))
	for _, result := range results {
		if function.IsSuccessStatusCode(result.StatusCode) {
			dest = append(dest, result.DeepCopy())
		}
	}
	return dest
}

// Computes the execution costs for all unfiltered results.
func computeExecutionCosts(results *function.ResourceProfileResults, profile *function.ResourceProfile) {
	for _, result := range results.UnfilteredResults {
		cost := profile.CalculateCost(result.ExecutionTimeMs)
		costStr := fmt.Sprintf("%10f", cost)
		costStr = strings.Trim(costStr, " ")
		result.ExecutionCost = &costStr
	}
}

// Merges the two results into a new ResourceProfileResults object.
func mergeResults(a *function.ResourceProfileResults, b *function.ResourceProfileResults) *function.ResourceProfileResults {
	var deploymentStatus function.FunctionDeploymentStatus
	if a.DeploymentStatus == function.DeploymentSuccess || b.DeploymentStatus == function.DeploymentSuccess {
		deploymentStatus = function.DeploymentSuccess
	} else {
		deploymentStatus = b.DeploymentStatus
	}

	ret := &function.ResourceProfileResults{
		ResourceProfileId: a.ResourceProfileId,
		DeploymentStatus:  deploymentStatus,
		UnfilteredResults: make([]*function.ProfilingResult, 0, len(a.UnfilteredResults)+len(b.UnfilteredResults)),
	}

	ret.UnfilteredResults = append(ret.UnfilteredResults, a.UnfilteredResults...)
	ret.UnfilteredResults = append(ret.UnfilteredResults, b.UnfilteredResults...)
	sortProfilingResultsByInputSize(ret.UnfilteredResults)
	ret.Results = copyAndPruneResults(ret.UnfilteredResults)

	return ret
}

// Counts and sets the number of profiled and number of inferred configurations (ResourceProfile-InputSize combinations).
func countProfiledAndInferredConfigurations(results *function.ProfilingSessionResults) {
	var profiled int32 = 0
	var inferred int32 = 0

	for _, resProfileResult := range results.Results {
		for _, inputResult := range resProfileResult.UnfilteredResults {
			if inputResult.ResultType != nil && *inputResult.ResultType == function.ProfilingResultInferred {
				inferred++
			} else {
				profiled++
			}
		}
	}

	results.ConfigurationsProfiled = profiled
	results.ConfigurationsInferred = inferred
}
