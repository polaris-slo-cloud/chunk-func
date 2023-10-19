package trigger

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"

	knServing "knative.dev/serving/pkg/apis/serving/v1"
	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
	"polaris-slo-cloud.github.io/chunk-func/common/pkg/kubeutil"
	"polaris-slo-cloud.github.io/chunk-func/common/pkg/timing"
)

var (
	_ TimedFunctionTrigger[any] = (*RestTrigger)(nil)
)

type RestTrigger struct {
	httpClient *http.Client
}

func NewRestTrigger() *RestTrigger {
	rt := &RestTrigger{
		httpClient: &http.Client{},
	}
	return rt
}

func (rt *RestTrigger) TriggerFunction(ctx context.Context, fn *knServing.Service, input *function.FunctionInput) (*FunctionExecutionResult[any], error) {
	reqURI := kubeutil.GetKnativeServiceURL(fn)
	bodyBuffer, err := input.MessageAsJsonBuffer()
	if err != nil {
		return nil, err
	}

	httpReq, err := rt.createPostRequest(ctx, reqURI, bodyBuffer)
	if err != nil {
		return nil, err
	}

	var responseBody any
	stopwatch := timing.NewStopwatch()
	stopwatch.Start()
	httpResp, err := rt.httpClient.Do(httpReq)
	stopwatch.Stop()

	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			httpResp = &http.Response{
				StatusCode: function.TimeoutStatusCode,
			}
		} else {
			return nil, fmt.Errorf(
				"error while invoking function via REST. URI: %s, error: %v",
				reqURI,
				err,
			)
		}
	}
	if httpResp.Body != nil {
		defer httpResp.Body.Close()
		if function.IsSuccessStatusCode(int32(httpResp.StatusCode)) {
			responseBody, err = parseResponseBody[any](httpResp)
		} else {
			responseBody, err = getErrorResponseBody(httpResp)
		}
		if err != nil {
			return nil, err
		}
	}

	// We return the result of a successful or a failed function execution in the same way,
	// because a failed execution might indicate the the function did not have enough resources.
	execResult := &FunctionExecutionResult[any]{
		StatusCode:   httpResp.StatusCode,
		Response:     responseBody,
		ResponseTime: stopwatch.Duration(),
	}
	return execResult, nil
}

func (rt *RestTrigger) createPostRequest(ctx context.Context, requestURI string, bodyBuffer *bytes.Buffer) (*http.Request, error) {
	httpReq, err := http.NewRequestWithContext(ctx, "POST", requestURI, bodyBuffer)
	if err != nil {
		return nil, err
	}

	httpReq.Header["Content-Type"] = []string{"application/json"}
	httpReq.Header["Accept"] = []string{"application/json"}

	return httpReq, nil
}

func parseResponseBody[T any](httpResp *http.Response) (*T, error) {
	body, err := io.ReadAll(httpResp.Body)
	if err != nil {
		return nil, err
	}

	responseObj := new(T)
	if err := json.Unmarshal(body, responseObj); err != nil {
		return nil, fmt.Errorf("%v StatusCode: %v, Body: %s", err, httpResp.StatusCode, string(body))
	}

	return responseObj, nil
}

func getErrorResponseBody(httpResp *http.Response) (string, error) {
	body, err := io.ReadAll(httpResp.Body)
	if err != nil {
		return "", err
	}
	return string(body), nil
}
