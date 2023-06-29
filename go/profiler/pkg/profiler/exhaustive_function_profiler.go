package profiler

import (
	"context"

	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
)

var (
	_ FunctionProfiler = (*ExhaustiveFunctionProfiler)(nil)
)

// FunctionProfiler that tries out all candidate profiles (like an exhaustive search).
type ExhaustiveFunctionProfiler struct {
}

// Encapsulates the state of a profiling run.
type exhaustiveFunctionProfilerRun struct {
}

// ProfileFunction implements FunctionProfiler.
func (efp *ExhaustiveFunctionProfiler) ProfileFunction(ctx context.Context, fn *function.FunctionWithDescription, profilingConfig *ProfilingConfig) (*function.ProfilingResults, error) {
	if err := CheckKnativeServiceIsValid(fn); err != nil {
		return nil, err
	}
}

func (pr *exhaustiveFunctionProfilerRun) evaluateProfile(
	fn *function.FunctionWithDescription,
	resourceProfile *function.ResourceProfile,
	profilingConfig *ProfilingConfig,
) ([]*function.ProfilingResults, error) {

}
