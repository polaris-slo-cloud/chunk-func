package profiler

import (
	"context"
	"time"

	knServing "knative.dev/serving/pkg/apis/serving/v1"
	knServingClient "knative.dev/serving/pkg/client/clientset/versioned/typed/serving/v1"
)

var (
	_ FunctionDeploymentManager = (*functionDeploymentManagerImpl)(nil)
)

// Allows deploying functions (Knative Services), waiting for them to become ready and deleting them.
type FunctionDeploymentManager interface {
	// Gets a name for this function that is guaranteed to be unique among all functions currently deployed with this FunctionDeploymentManager.
	// This is needed, because parallel profiling may try to create multiple objects with the same name.
	GetUniqueFunctionName(proposedName string) string

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

// Factory function for creating a FunctionDeploymentManager
type FunctionDeploymentManagerFactoryFn func(client knServingClient.ServingV1Interface) FunctionDeploymentManager
