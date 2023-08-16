package optimizer

import "polaris-slo-cloud.github.io/chunk-func/common/pkg/function"

// Determines which ResourceProfile best meets a certain optimization criteria for a function.
//
// The optimization criteria depends on the specific FunctionOptimizer implementation.
// A FunctionOptimizer must be safe for concurrent use from multiple goroutines.
type FunctionOptimizer interface {
	// Finds an optimized configuration for each input size of the specified function, using its profiling results.
	FindOptimizedConfigs(fn *function.FunctionWithDescription, profilingResults *function.ProfilingSessionResults) ([]*function.OptimizedFunctionConfig, error)

	// Returns the objective that this FunctionOptimizer optimizes for.
	OptimizationObjective() string
}
