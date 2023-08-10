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
	_ FunctionDeploymentManager = (*functionDeploymentManagerImpl)(nil)
)

// Allows deploying functions (Knative Services), waiting for them to become ready and deleting them.
type FunctionDeploymentManager interface {
	// Deploys the specified function and returns the deployed object.
	DeployFunction(ctx context.Context, fn *knServing.Service) (*knServing.Service, error)

	// Waits for the specified function to be ready and available for accepting input.
	// Note that readiness does not guarantee that a replica is active (i.e., that there is no cold start).
	//
	// Returns the latest version of the function on success.
	// Returns an error, if an error occurred. This is context.DeadlineExceeded error if the timeout occurred before the function was ready.
	// Check for this error using errors.Is(err, context.DeadlineExceeded)
	WaitForFunctionToBeReady(ctx context.Context, fn *knServing.Service, timeout time.Duration) (*knServing.Service, error)

	// Deletes the specified function.
	DeleteFunction(ctx context.Context, fn *knServing.Service) error
}

// Default implementation of FunctionDeploymentManager.
//
// IMPORTANT: Currently we use use a raw client, but at some point the KnServingClient from knative.dev/client-pkg/pkg/serving/v1 could be useful.
type functionDeploymentManagerImpl struct {
	client knServingClient.ServingV1Interface
}

// Creates a new instance of the default FunctionDeploymentManager implementation.
func NewFunctionDeploymentManager(client knServingClient.ServingV1Interface) FunctionDeploymentManager {
	mgr := &functionDeploymentManagerImpl{
		client: client,
	}
	return mgr
}

func (mgr *functionDeploymentManagerImpl) DeleteFunction(ctx context.Context, fn *knServing.Service) error {
	return mgr.client.Services(fn.Namespace).Delete(ctx, fn.Name, meta.DeleteOptions{})
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
				return modFn, nil
			}
		default:
		}
	}

	// If we get here, the context was cancelled or timed out.
	return nil, ctxWithTimeout.Err()
}
