package trigger

import (
	"context"
	"time"

	knServing "knative.dev/serving/pkg/apis/serving/v1"
	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
)

// The result of a function execution.
type FunctionExecutionResult[R any] struct {
	// The HTTP status code returned by the function.
	// If the function is not triggered via REST, this contains the
	// exit code of the function converted into an HTTP status code.
	StatusCode int

	// The response of the function.
	Response R

	// The duration between starting to send the request and fully receiving the response.
	ResponseTime time.Duration
}

// Used to trigger a serverless function and track its execution time.
//
// R - The type of response received from a function.
type TimedFunctionTrigger[R any] interface {
	// Triggers the function with the specified input and returns the execution result.
	//
	// The result of a successful or a failed function execution is returned in the same way,
	// because a failed execution might indicate the the function did not have enough resources.
	// Please check the StatusCode of the result to see if the execution has succeeded.
	//
	// An error is only returned if there is an issue serializing the input, making the HTTP request,
	// or if the context is cancelled.
	TriggerFunction(ctx context.Context, fn *knServing.Service, input *function.FunctionInput) (*FunctionExecutionResult[R], error)
}
