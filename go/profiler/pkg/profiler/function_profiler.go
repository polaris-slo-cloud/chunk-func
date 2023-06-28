package profiler

import (
	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
)

type FunctionProfiler interface {
	ProfileFunction(fn function.FunctionDescription) *function.ProfilingResults
}
