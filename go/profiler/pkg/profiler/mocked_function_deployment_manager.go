package profiler

import (
	"context"
	"time"

	"polaris-slo-cloud.github.io/chunk-func/common/pkg/kubeutil"

	knServing "knative.dev/serving/pkg/apis/serving/v1"
	knServingClient "knative.dev/serving/pkg/client/clientset/versioned/typed/serving/v1"
)

var (
	_ FunctionDeploymentManager          = (*mockedFunctionDeploymentManager)(nil)
	_ FunctionDeploymentManagerFactoryFn = NewFunctionDeploymentManager
)

// FunctionDeploymentManager implementation that performs no actual deployments, for use with the MockedResultsTrigger.
type mockedFunctionDeploymentManager struct {
	objNameTracker *kubeutil.ObjectNameTracker
}

// Creates a new instance of the mockedFunctionDeploymentManager implementation.
func NewMockedFunctionDeploymentManager(client knServingClient.ServingV1Interface) FunctionDeploymentManager {
	return &mockedFunctionDeploymentManager{
		objNameTracker: kubeutil.NewObjectNameTracker(),
	}
}

func (mgr *mockedFunctionDeploymentManager) GetUniqueFunctionName(proposedName string) string {
	return mgr.objNameTracker.GetNewObjectName(proposedName)
}

func (mgr *mockedFunctionDeploymentManager) DeleteFunction(ctx context.Context, fn *knServing.Service) error {
	mgr.objNameTracker.ReleaseObjectName(fn.Name)
	return nil
}

func (mgr *mockedFunctionDeploymentManager) DeployFunction(ctx context.Context, fn *knServing.Service) (*knServing.Service, error) {
	return fn, nil
}

func (mgr *mockedFunctionDeploymentManager) WaitForFunctionToBeReady(ctx context.Context, fn *knServing.Service, timeout time.Duration) (*knServing.Service, error) {
	return fn, nil
}
