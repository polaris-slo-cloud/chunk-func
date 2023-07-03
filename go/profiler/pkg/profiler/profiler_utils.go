package profiler

import (
	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
)

// Aggregates individual profiling results for a single resource profile and single input size into one result.
func AggregateProfilingResults(results []*function.ProfilingResult) *function.ProfilingResult {
	if len(results) == 0 {
		return nil
	}

	var totalTimeMs int64 = 0
	for _, result := range results {
		totalTimeMs += result.ExecutionTimeMs
	}

	ret := &function.ProfilingResult{
		InputSizeBytes:  results[0].InputSizeBytes,
		ExecutionTimeMs: totalTimeMs / int64(len(results)),
	}
	return ret
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
