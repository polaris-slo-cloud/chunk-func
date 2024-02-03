package profiler

import (
	"context"
	"fmt"

	"github.com/go-logr/logr"
	"k8s.io/client-go/rest"
	knServingClient "knative.dev/serving/pkg/client/clientset/versioned/typed/serving/v1"

	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
	"polaris-slo-cloud.github.io/chunk-func/profiler/pkg/trigger"
)

var (
	_ FunctionProfiler = (*ExhaustiveFunctionProfiler)(nil)
)

// FunctionProfiler that tries out all candidate profiles (like an exhaustive search).
type ExhaustiveFunctionProfiler struct {
	servingClient      knServingClient.ServingV1Interface
	fnTriggerFactoryFn trigger.TimedFunctionTriggerFactoryFn[any]
	logger             *logr.Logger
}

// Creates a new FunctionProfiler with the specified REST config and logger.
//
// This function takes a rest.Config instead of a rest.Interface, because each API group requires a distinct client instance
// (see https://github.com/kubernetes/client-go/issues/1288#issuecomment-1667886214).
// Thus, we let knServing handle the adaptation of the config.
func NewExhaustiveFunctionProfiler(
	k8sConfig *rest.Config,
	fnTriggerFactoryFn trigger.TimedFunctionTriggerFactoryFn[any],
	logger *logr.Logger,
) *ExhaustiveFunctionProfiler {
	modifiableConfig := rest.CopyConfig(k8sConfig)
	efp := &ExhaustiveFunctionProfiler{
		servingClient:      knServingClient.NewForConfigOrDie(modifiableConfig),
		fnTriggerFactoryFn: fnTriggerFactoryFn,
		logger:             logger,
	}
	return efp
}

// ProfileFunction implements FunctionProfiler.
func (efp *ExhaustiveFunctionProfiler) ProfileFunction(ctx context.Context, fn *function.FunctionWithDescription, profilingConfig *ProfilingConfig) (*function.ProfilingSessionResults, error) {
	if err := CheckKnativeServiceIsValid(fn); err != nil {
		return nil, err
	}
	if len(profilingConfig.CandidateProfiles) == 0 {
		return nil, fmt.Errorf("the ProfilingConfig does not contain any CandidateProfiles")
	}
	if len(fn.Description.TypicalInputs) == 0 {
		return nil, fmt.Errorf("the FunctionWithDescription does not contain any TypicalInputs")
	}

	profilingStrategy := NewExhaustiveProfilingStrategy()
	fps := NewFunctionProfilingSession(fn, profilingConfig, profilingStrategy, efp.fnTriggerFactoryFn, efp.servingClient, efp.logger)
	return fps.ExecuteProfilingSession(ctx)
}
