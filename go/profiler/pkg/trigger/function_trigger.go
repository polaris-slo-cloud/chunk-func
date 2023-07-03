package trigger

import (
	"context"
	"time"

	knServing "knative.dev/serving/pkg/apis/serving/v1"
	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
)

// The result of a function execution.
type FunctionExecutionResult[R any] struct {
	// The response of the function.
	Response R

	// The duration between starting to send the request and fully receiving the response.
	ResponseTime time.Duration
}

// Used to trigger a serverless function and track its execution time.
//
// R - The type of response received from a function.
type TimedFunctionTrigger[R any] interface {
	TriggerFunction(ctx context.Context, fn *knServing.Service, input *function.FunctionInput) (*FunctionExecutionResult[R], error)
}
