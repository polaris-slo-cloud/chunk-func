package optimizer

import (
	"fmt"

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
		optConfig, err := opt.findConfigForInput(profilingResults, input.SizeBytes, fn.Description.MaxResponseTimeMs)
		if err != nil {
			return nil, err
		}
		optimizedConfigs[i] = optConfig
	}

	return optimizedConfigs, nil
}

func (opt *ResponseTimeSloAndCostOptimizer) findConfigForInput(profilingResults *function.ProfilingSessionResults, inputSizeBytes int64, maxResponseTimeMs int64) (*function.OptimizedFunctionConfig, error) {
	for _, resProfileResults := range profilingResults.Results {
		resultForInput := resProfileResults.FindResultForInputSize(inputSizeBytes)
		if resultForInput == nil {
			return nil, fmt.Errorf("could not find a profiling result for ResourceProfile %s and input size %d", resProfileResults.ResourceProfileId, inputSizeBytes)
		}

		if function.IsSuccessStatusCode(resultForInput.StatusCode) && resultForInput.ExecutionTimeMs <= maxResponseTimeMs {
			config := &function.OptimizedFunctionConfig{
				OptimizedFor:   opt.OptimizationObjective(),
				InputSizeBytes: inputSizeBytes,
				Config:         &opt.availableProfiles[resProfileResults.ResourceProfileId].ResourceConfiguration,
			}
			return config, nil
		}
	}

	return nil, fmt.Errorf("no ResourceProfile fulfills the response time SLO %dms for input size %d", maxResponseTimeMs, inputSizeBytes)
}
