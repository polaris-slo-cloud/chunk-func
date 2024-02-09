package profiler

import (
	"context"
	"fmt"
	"time"

	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
	watchPkg "k8s.io/apimachinery/pkg/watch"
	"polaris-slo-cloud.github.io/chunk-func/common/pkg/kubeutil"

	knServing "knative.dev/serving/pkg/apis/serving/v1"
	knServingClient "knative.dev/serving/pkg/client/clientset/versioned/typed/serving/v1"
)

var (
	_ FunctionDeploymentManager          = (*functionDeploymentManagerImpl)(nil)
	_ FunctionDeploymentManagerFactoryFn = NewFunctionDeploymentManager
)

// Default implementation of FunctionDeploymentManager.
//
// IMPORTANT: Currently we use use a raw client, but at some point the KnServingClient from knative.dev/client-pkg/pkg/serving/v1 could be useful.
type functionDeploymentManagerImpl struct {
	client         knServingClient.ServingV1Interface
	objNameTracker *kubeutil.ObjectNameTracker
}

// Creates a new instance of the default FunctionDeploymentManager implementation.
func NewFunctionDeploymentManager(client knServingClient.ServingV1Interface) FunctionDeploymentManager {
	mgr := &functionDeploymentManagerImpl{
		client:         client,
		objNameTracker: kubeutil.NewObjectNameTracker(),
	}
	return mgr
}

func (mgr *functionDeploymentManagerImpl) GetUniqueFunctionName(proposedName string) string {
	return mgr.objNameTracker.GetNewObjectName(proposedName)
}

func (mgr *functionDeploymentManagerImpl) DeleteFunction(ctx context.Context, fn *knServing.Service) error {
	err := mgr.client.Services(fn.Namespace).Delete(ctx, fn.Name, meta.DeleteOptions{})
	if err == nil {
		mgr.objNameTracker.ReleaseObjectName(fn.Name)
	}
	return err
}

func (mgr *functionDeploymentManagerImpl) DeployFunction(ctx context.Context, fn *knServing.Service) (*knServing.Service, error) {
	return mgr.client.Services(fn.Namespace).Create(ctx, fn, meta.CreateOptions{})
}

func (mgr *functionDeploymentManagerImpl) WaitForFunctionToBeReady(ctx context.Context, fn *knServing.Service, timeout time.Duration) (*knServing.Service, error) {
	ctxWithTimeout, cancelFn := context.WithTimeout(ctx, timeout)
	defer cancelFn()

	watch, err := mgr.client.Services(fn.Namespace).Watch(ctxWithTimeout, meta.ListOptions{
		FieldSelector: "metadata.name=" + fn.Name,
	})
	if err != nil {
		return nil, err
	}
	defer watch.Stop()

	watchChan := watch.ResultChan()

	for event := range watchChan {
		switch event.Type {
		case watchPkg.Deleted:
			return nil, fmt.Errorf("the Knative Service %s.%s was deleted while waiting for it to become ready", fn.Namespace, fn.Name)
		case watchPkg.Error:
			return nil, fmt.Errorf("unexpected error on watch on Knative Service %s.%s", fn.Namespace, fn.Name)
		case watchPkg.Modified:
			modFn := CoerceToKnativeServiceOrPanic(event.Object)
			if kubeutil.IsKnativeServiceReady(modFn) {
				// ToDo: There is a race condition with the K8s DNS service.
				// After the Knative Service is in RoutesReady, DNS needs a short time
				// to pick it up. Sleeping is so far the only solution I found.
				sleepDuration, err := time.ParseDuration("2s")
				if err != nil {
					panic(err)
				}
				time.Sleep(sleepDuration)
				return modFn, nil
			}
		default:
		}
	}

	// If we get here, the context was cancelled or timed out.
	return nil, ctxWithTimeout.Err()
}
