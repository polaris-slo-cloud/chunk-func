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
)

var (
	_ FunctionProfiler = (*BayesianOptFunctionProfiler)(nil)
)

// A FunctionProfiler that uses Bayesian Optimization to reduce the number resource profiles
// that need to be evaluated.
type BayesianOptFunctionProfiler struct {
	servingClient   knServingClient.ServingV1Interface
	boServerAddress string
	logger          *logr.Logger
}

// Creates a new FunctionProfiler with the specified REST config and logger.
//
// This function takes a rest.Config instead of a rest.Interface, because each API group requires a distinct client instance
// (see https://github.com/kubernetes/client-go/issues/1288#issuecomment-1667886214).
// Thus, we let knServing handle the adaptation of the config.
func NewBayesianOptFunctionProfiler(k8sConfig *rest.Config, boServerAddress string, logger *logr.Logger) *BayesianOptFunctionProfiler {
	modifiableConfig := rest.CopyConfig(k8sConfig)
	efp := &BayesianOptFunctionProfiler{
		servingClient: knServingClient.NewForConfigOrDie(modifiableConfig),
		logger:        logger,
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

	profilingStrategy := NewBayesianOptProfilingStrategy(boClient, bfp.logger)
	fps := NewFunctionProfilingSession(fn, profilingConfig, profilingStrategy, bfp.servingClient, bfp.logger)
	return fps.ExecuteProfilingSession(ctx)
}

func (bfp *BayesianOptFunctionProfiler) connectgRPC() (*grpc.ClientConn, error) {
	conn, err := grpc.Dial(bfp.boServerAddress, grpc.WithTransportCredentials(insecure.NewCredentials()), grpc.WithBlock())
	if err != nil {
		return nil, err
	}
	return conn, nil
}
