package profiler

import (
	"context"

	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
)

var (
	_ ProfilingJob = (*ObservableProfilingJob)(nil)
)

// Called when profiling is complete.
type ProfilingDoneCallback func(ctx context.Context, job ProfilingJob, results *function.ResourceProfileResults)

// Called if profiling ends with an error.
type ProfilingErrorCallback func(job ProfilingJob, err error)

// ProfilingJob implementation, where the done and error events may be
// observed using callbacks.
type ObservableProfilingJob struct {
	resourceProfile *function.ResourceProfile
	inputs          []*function.FunctionInput
	doneCallback    ProfilingDoneCallback
	errorCallback   ProfilingErrorCallback
}

// Creates a new ObservableProfilingJob.
// Both callbacks are optional and may be nil.
func NewObservableProfilingJob(
	resourceProfile *function.ResourceProfile,
	inputs []*function.FunctionInput,
	doneCallback ProfilingDoneCallback,
	errorCallback ProfilingErrorCallback,
) *ObservableProfilingJob {
	return &ObservableProfilingJob{
		resourceProfile: resourceProfile,
		inputs:          inputs,
		doneCallback:    doneCallback,
		errorCallback:   errorCallback,
	}
}

func (pj *ObservableProfilingJob) ResourceProfile() *function.ResourceProfile {
	return pj.resourceProfile
}

func (pj *ObservableProfilingJob) Inputs() []*function.FunctionInput {
	return pj.inputs
}

func (pj *ObservableProfilingJob) ProfilingDone(ctx context.Context, results *function.ResourceProfileResults) {
	if pj.doneCallback != nil {
		pj.doneCallback(ctx, pj, results)
	}
}

func (pj *ObservableProfilingJob) ProfilingError(err error) {
	if pj.errorCallback != nil {
		pj.errorCallback(pj, err)
	}
}
