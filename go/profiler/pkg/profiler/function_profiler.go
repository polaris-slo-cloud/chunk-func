package profiler

import (
	"context"
	"time"

	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
)

// Configuration for a profiling session.
type ProfilingConfig struct {
	// The candidate profiles that should be tried out.
	// These profiles are ordered by increasing cost (per 100ms).
	CandidateProfiles []*function.ResourceProfile

	// The number of iterations to execute for a single input size and profile.
	// The total number of iterations for each profile is given by
	// IterationsPerInputAndProfile * len(FunctionDescription.TypicalInputs)
	IterationsPerInputAndProfile int

	// The number of profiles that can be checked concurrently.
	ConcurrentProfiles int

	// The (existing namespace) that should be used for creating the temporary functions for profiling.
	ProfilingNamespace string

	// The time to wait for a function to become ready after creating it.
	FunctionReadyTimeout time.Duration
}

// Performs profiling operations on single functions.
// A FunctionProfiler must safe for use from multiple goroutines.
type FunctionProfiler interface {

	// Profiles the specified function using the parameters from the config.
	// This operation may take a considerable amount of time (multiple minutes).
	ProfileFunction(ctx context.Context, fn *function.FunctionWithDescription, profilingConfig *ProfilingConfig) (*function.ProfilingSessionResults, error)
}
