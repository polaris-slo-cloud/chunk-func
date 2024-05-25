package profiler

import (
	"context"
	"time"

	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
)

// Configuration for a profiling session.
type ProfilingConfig struct {
	// The candidate profiles that should be tried out.
	// These profiles are ordered by increasing memory size and base cost (per 100ms).
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
// A FunctionProfiler must be safe for use from multiple goroutines.
type FunctionProfiler interface {

	// Profiles the specified function using the parameters from the config.
	// This operation may take a considerable amount of time (multiple minutes).
	ProfileFunction(ctx context.Context, fn *function.FunctionWithDescription, profilingConfig *ProfilingConfig) (*function.ProfilingSessionResults, error)
}

// Contains a ResourceProfile and a set of inputs that should be evaluated for the current function.
type ProfilingJob interface {

	// Gets the ResourceProfile that should be profiled.
	ResourceProfile() *function.ResourceProfile

	// Gets the inputs that should be profiled with the ResourceProfile.
	Inputs() []*function.FunctionInput

	// Signals that the profiling for this profile is complete.
	ProfilingDone(ctx context.Context, results *function.ResourceProfileResults)

	// Signals an error during profiling.
	ProfilingError(err error)
}

// Encapsulates a profiling strategy consisting of the selection of resource profiles that will be profiled the results aggregation.
//
// A strategy may profile all available resource profiles or only a subset of them.
// In the latter case, the aggregation uses some strategy to interpolate or infer the results for the not profiled resource profiles.
type ProfilingStrategy interface {

	// Creates a channel that emits ProfilingJobs.
	//
	// New jobs may be pushed to the channel asynchronously.
	// When a ResourceProfile has been profiled with all inputs, the ProfilingDone() needs to be called on the respective job object.
	// When all needed profiles and inputs have been evaluated or queued, the channel is closed.
	//
	// Since this method may operate asynchronously, the abortOnErrorFn will be called if there is an unrecoverable error that requires the
	// profiling session to be aborted.
	SetUpProfilingQueue(ctx context.Context, fn *function.FunctionWithDescription, availableProfiles []*function.ResourceProfile, abortOnErrorFn context.CancelCauseFunc) (chan ProfilingJob, error)

	// Aggregates the already filtered and sorted results of a profiling session into the final ProfilingSessionResults.
	// resultsMap stores the profiling results using resourceProfile.ID() as keys.
	// This operation may involve communication with an external service, e.g., to infer results for not evaluated profiles.
	AggregateAllResults(ctx context.Context, rawResults map[string]*function.ResourceProfileResults) (*function.ProfilingSessionResults, error)

	// Frees any external resources that were allocated by this strategy.
	Cleanup()
}
