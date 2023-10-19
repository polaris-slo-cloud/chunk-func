package profiler

import (
	"fmt"

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

// Creates a buffered channel filled with the candidate profiles for distributing them to worker goroutines.
func setUpCandidateProfilesChan(candidateProfiles []*function.ResourceProfile) chan *function.ResourceProfile {
	profiles := make(chan *function.ResourceProfile, len(candidateProfiles))
	for _, resProfile := range candidateProfiles {
		profiles <- resProfile
	}
	close(profiles)
	return profiles
}
