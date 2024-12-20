package profiler

import (
	"context"
	"fmt"

	"github.com/go-logr/logr"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"k8s.io/client-go/rest"
	knServingClient "knative.dev/serving/pkg/client/clientset/versioned/typed/serving/v1"

	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
	"polaris-slo-cloud.github.io/chunk-func/profiler/pkg/bayesianopt"
	"polaris-slo-cloud.github.io/chunk-func/profiler/pkg/trigger"
)

var (
	_ FunctionProfiler = (*BayesianOptFunctionProfiler)(nil)
)

// A FunctionProfiler that uses Bayesian Optimization to reduce the number resource profiles
// that need to be evaluated.
type BayesianOptFunctionProfiler struct {
	servingClient        knServingClient.ServingV1Interface
	fnTriggerFactoryFn   trigger.TimedFunctionTriggerFactoryFn[any]
	deploymentMgrFactory FunctionDeploymentManagerFactoryFn
	boServerAddress      string
	minSamplesPercent    float64
	maxSamplesPercent    float64
	xi                   float64
	poiThreshold         float64
	logger               *logr.Logger
}

// Creates a new FunctionProfiler with the specified REST config and logger.
//
// This function takes a rest.Config instead of a rest.Interface, because each API group requires a distinct client instance
// (see https://github.com/kubernetes/client-go/issues/1288#issuecomment-1667886214).
// Thus, we let knServing handle the adaptation of the config.
func NewBayesianOptFunctionProfiler(
	k8sConfig *rest.Config,
	boServerAddress string,
	fnTriggerFactoryFn trigger.TimedFunctionTriggerFactoryFn[any],
	deploymentMgrFactory FunctionDeploymentManagerFactoryFn,
	minSamplesPercent float64,
	maxSamplesPercent float64,
	xi float64,
	poiThreshold float64,
	logger *logr.Logger,
) *BayesianOptFunctionProfiler {
	modifiableConfig := rest.CopyConfig(k8sConfig)
	efp := &BayesianOptFunctionProfiler{
		servingClient:        knServingClient.NewForConfigOrDie(modifiableConfig),
		fnTriggerFactoryFn:   fnTriggerFactoryFn,
		deploymentMgrFactory: deploymentMgrFactory,
		boServerAddress:      boServerAddress,
		minSamplesPercent:    minSamplesPercent,
		maxSamplesPercent:    maxSamplesPercent,
		xi:                   xi,
		poiThreshold:         poiThreshold,
		logger:               logger,
	}
	return efp
}

// ProfileFunction implements FunctionProfiler.
func (bfp *BayesianOptFunctionProfiler) ProfileFunction(ctx context.Context, fn *function.FunctionWithDescription, profilingConfig *ProfilingConfig) (*function.ProfilingSessionResults, error) {
	if err := CheckKnativeServiceIsValid(fn); err != nil {
		return nil, err
	}
	if len(profilingConfig.CandidateProfiles) == 0 {
		return nil, fmt.Errorf("the ProfilingConfig does not contain any CandidateProfiles")
	}
	if len(fn.Description.TypicalInputs) == 0 {
		return nil, fmt.Errorf("the FunctionWithDescription does not contain any TypicalInputs")
	}

	conn, err := bfp.connectgRPC()
	if err != nil {
		return nil, err
	}
	defer conn.Close()
	boClient := bayesianopt.NewBayesianOptimizerServiceClient(conn)

	profilingStrategy := NewBayesianOptProfilingStrategy(boClient, bfp.minSamplesPercent, bfp.maxSamplesPercent, bfp.xi, bfp.poiThreshold, bfp.logger)
	fps := NewFunctionProfilingSession(fn, profilingConfig, profilingStrategy, bfp.fnTriggerFactoryFn, bfp.servingClient, bfp.deploymentMgrFactory, bfp.logger)
	return fps.ExecuteProfilingSession(ctx)
}

func (bfp *BayesianOptFunctionProfiler) connectgRPC() (*grpc.ClientConn, error) {
	conn, err := grpc.Dial(bfp.boServerAddress, grpc.WithTransportCredentials(insecure.NewCredentials()), grpc.WithBlock())
	if err != nil {
		return nil, err
	}
	return conn, nil
}
