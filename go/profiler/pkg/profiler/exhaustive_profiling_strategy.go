package profiler

import (
	"context"
	"sync/atomic"

	"github.com/go-logr/logr"
	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
)

var (
	_ ProfilingStrategy = (*ExhaustiveProfilingStrategy)(nil)
)

type ExhaustiveProfilingStrategy struct {
	// The available profiles that should be tried out.
	// These profiles are ordered by increasing memory size and base cost (per 100ms).
	availableProfiles []*function.ResourceProfile

	// The number profiles that have already been profiled.
	profilesComplete atomic.Int32

	logger *logr.Logger
}

func NewExhaustiveProfilingStrategy(logger *logr.Logger) *ExhaustiveProfilingStrategy {
	return &ExhaustiveProfilingStrategy{
		profilesComplete: atomic.Int32{},
		logger:           logger,
	}
}

// Creates a buffered channel filled with all available profiles for distributing them to worker goroutines.
func (efps *ExhaustiveProfilingStrategy) SetUpProfilingQueue(
	ctx context.Context,
	fn *function.FunctionWithDescription,
	availableProfiles []*function.ResourceProfile,
	abortOnErrorFn context.CancelCauseFunc,
) (chan ProfilingJob, error) {
	efps.availableProfiles = availableProfiles
	profiles := make(chan ProfilingJob, len(availableProfiles))
	for _, resProfile := range availableProfiles {
		profiles <- NewObservableProfilingJob(
			resProfile,
			fn.Description.TypicalInputs,
			efps.onProfilingDone,
			nil,
		)
	}
	close(profiles)
	return profiles, nil
}

func (efps *ExhaustiveProfilingStrategy) onProfilingDone(ctx context.Context, job ProfilingJob, results *function.ResourceProfileResults) {
	profilesComplete := efps.profilesComplete.Add(1)
	totalProfiles := len(efps.availableProfiles)
	efps.logger.Info("ResourceProfile profiled", "resourceProfile", results.ResourceProfileId, "profilesComplete", profilesComplete, "totalProfiles", totalProfiles)
}

func (efps *ExhaustiveProfilingStrategy) AggregateAllResults(ctx context.Context, resultsMap map[string]*function.ResourceProfileResults) (*function.ProfilingSessionResults, error) {
	ret := &function.ProfilingSessionResults{
		Results: make([]*function.ResourceProfileResults, len(efps.availableProfiles)),
	}

	for i, resProfile := range efps.availableProfiles {
		resProfileResults := resultsMap[resProfile.ID()]
		ret.Results[i] = resProfileResults
	}
	countProfiledAndInferredConfigurations(ret)

	return ret, nil
}

func (efps *ExhaustiveProfilingStrategy) Cleanup() {
	// No cleanup needed
}
