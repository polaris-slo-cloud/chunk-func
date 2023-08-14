package optimizer

import (
	"math"

	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
	"polaris-slo-cloud.github.io/chunk-func/profiler/pkg/profile"
)

const (
	responseTimeSloAndCostOptimizerObjective = "response-time-slo-and-min-cost"
)

var (
	_ FunctionOptimizer = (*ResponseTimeSloAndCostOptimizer)(nil)
)

// FunctionOptimizer that picks the cheapest configuration that allows meeting the response time SLO.
type ResponseTimeSloAndCostOptimizer struct {
	availableProfiles map[string]*function.ResourceProfile
}

// Creates a new ResponseTimeSloAndCostOptimizer.
func NewResponseTimeSloAndCostOptimizer() *ResponseTimeSloAndCostOptimizer {
	profiles := profile.GetAvailableResourceProfiles()
	availableProfilesMap := make(map[string]*function.ResourceProfile, len(profiles))
	for _, profile := range profiles {
		availableProfilesMap[profile.ID()] = profile
	}

	opt := &ResponseTimeSloAndCostOptimizer{
		availableProfiles: availableProfilesMap,
	}
	return opt
}

func (opt *ResponseTimeSloAndCostOptimizer) OptimizationObjective() string {
	return responseTimeSloAndCostOptimizerObjective
}

func (opt *ResponseTimeSloAndCostOptimizer) FindOptimizedConfigs(fn *function.FunctionWithDescription, profilingResults *function.ProfilingSessionResults) ([]*function.OptimizedFunctionConfig, error) {
	inputsCount := len(fn.Description.TypicalInputs)
	optimizedConfigs := make([]*function.OptimizedFunctionConfig, inputsCount)

	for i, input := range fn.Description.TypicalInputs {
		optConfig := opt.findConfigForInput(profilingResults, input.SizeBytes, fn.Description.MaxResponseTimeMs)
		optimizedConfigs[i] = optConfig
	}

	return optimizedConfigs, nil
}

// Returns the cheapest resource config that fulfills the response time SLO.
// If no config fulfills the SLO, the Config field of the returned object is nil.
func (opt *ResponseTimeSloAndCostOptimizer) findConfigForInput(profilingResults *function.ProfilingSessionResults, inputSizeBytes int64, maxResponseTimeMs int64) *function.OptimizedFunctionConfig {
	config := &function.OptimizedFunctionConfig{
		OptimizedFor:   opt.OptimizationObjective(),
		InputSizeBytes: inputSizeBytes,
	}

	var lowestCost float64 = math.Inf(1)

	for _, resProfileResults := range profilingResults.Results {
		resProfile := opt.availableProfiles[resProfileResults.ResourceProfileId]
		resultForInput := resProfileResults.FindResultForInputSize(inputSizeBytes)
		if resultForInput == nil {
			// There were no successful profiling runs for the input size with this profile (possibly the resource config is too small for the input).
			continue
		}

		if function.IsSuccessStatusCode(resultForInput.StatusCode) && resultForInput.ExecutionTimeMs <= maxResponseTimeMs {
			cost := resProfile.CalculateCost(resultForInput.ExecutionTimeMs)
			if cost < lowestCost {
				lowestCost = cost
				config.Config = &opt.availableProfiles[resProfileResults.ResourceProfileId].ResourceConfiguration
			}
		}
	}

	return config
}
