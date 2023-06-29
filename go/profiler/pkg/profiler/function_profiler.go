package profiler

import (
	"context"

	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
)

// Configuration for a profiling session.
type ProfilingConfig struct {
	// The candidate profiles that should be tried out.
	CandidateProfiles []*function.ResourceProfile

	// The number of iterations to execute for a single profile.
	IterationsPerProfile int

	// The number of profiles that can be checked concurrently.
	ConcurrentProfiles int

	// The (existing namespace) that should be used for creating the temporary functions for profiling.
	ProfilingNamespace string
}

// Performs profiling operations on single functions.
type FunctionProfiler interface {

	// Profiles the specified function using the parameters from the config.
	// This operation may take a considerable amount of time (multiple minutes).
	ProfileFunction(ctx context.Context, fn *function.FunctionWithDescription, profilingConfig *ProfilingConfig) (*function.ProfilingResults, error)
}
