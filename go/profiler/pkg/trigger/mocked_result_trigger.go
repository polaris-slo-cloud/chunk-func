package trigger

import (
	"context"
	"fmt"
	"time"

	knServing "knative.dev/serving/pkg/apis/serving/v1"

	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
	"polaris-slo-cloud.github.io/chunk-func/common/pkg/kubeutil"
)

var (
	_ TimedFunctionTrigger[any] = (*MockedResultsTrigger)(nil)
)

// A TimedFunctionTrigger that returns mocked results for services, whose information is present in the mocked data
// and an error for all other services.
//
// If the mocked data indicates a deployment error, this trigger will return a timeout response for the respective profile.
type MockedResultsTrigger struct {
	// The mocked results indexed by "namespace.name" of Knative services.
	mockedResults map[string]*function.ProfilingSessionResults
}

// Creates a new MockedResultsTrigger with the specified mockedResults, which need to be indexed by "namespace.name" of Knative services.
func NewMockedResultsTrigger(mockedResults map[string]*function.ProfilingSessionResults) *MockedResultsTrigger {
	return &MockedResultsTrigger{
		mockedResults: mockedResults,
	}
}

// Creates a new MockedResultsTrigger with the specified mockedResults, which need to be indexed by "namespace.name" of Knative services.
func NewMockedResultsTriggerFactory(mockedResults map[string]*function.ProfilingSessionResults) TimedFunctionTriggerFactoryFn[any] {
	return func() TimedFunctionTrigger[any] {
		return NewMockedResultsTrigger(mockedResults)
	}
}

func (mrt *MockedResultsTrigger) TriggerFunction(ctx context.Context, fn *knServing.Service, input *function.FunctionInput) (*FunctionExecutionResult[any], error) {
	key, err := mrt.getResultsKeyForFunction(fn)
	if err != nil {
		return nil, err
	}

	profileID, err := mrt.getResourceProfileID(fn)
	if err != nil {
		return nil, err
	}

	mockedResults, ok := mrt.mockedResults[key]
	if !ok {
		return nil, fmt.Errorf("no mocked result found for %s", key)
	}

	profileResults := mrt.findResultsForProfile(profileID, mockedResults)
	if profileResults == nil {
		return nil, fmt.Errorf("no mocked result found for %s and ResourceProfile %s", key, profileID)
	}
	if profileResults.DeploymentStatus != function.DeploymentSuccess {
		ret := &FunctionExecutionResult[any]{
			StatusCode:   function.TimeoutStatusCode,
			Response:     nil,
			ResponseTime: time.Duration(100000 * 1e6),
		}
		return ret, nil
	}

	resultForInput := profileResults.FindResultForInputSize(input.SizeBytes)
	if resultForInput == nil {
		return nil, fmt.Errorf("no mocked result found for %s, ResourceProfile %s, and inputSize %v", key, profileID, input.SizeBytes)
	}

	ret := &FunctionExecutionResult[any]{
		StatusCode:   int(resultForInput.StatusCode),
		Response:     nil,
		ResponseTime: time.Duration(resultForInput.ExecutionTimeMs * 1e6),
	}
	return ret, nil
}

func (mrt *MockedResultsTrigger) getResultsKeyForFunction(fn *knServing.Service) (string, error) {
	if key, ok := kubeutil.GetAnnotation(fn, kubeutil.ProfiledServiceAnnotation); ok {
		return key, nil
	}
	return "", fmt.Errorf("the Knative service %s.%s is missing the annotation %s", fn.Namespace, fn.Name, kubeutil.ProfiledServiceAnnotation)
}

func (mrt *MockedResultsTrigger) getResourceProfileID(fn *knServing.Service) (string, error) {
	if profileID, ok := kubeutil.GetAnnotation(fn, kubeutil.ResourceProfileAnnotation); ok {
		return profileID, nil
	}
	return "", fmt.Errorf("the Knative service %s.%s is missing the annotation %s", fn.Namespace, fn.Name, kubeutil.ResourceProfileAnnotation)
}

func (mrt *MockedResultsTrigger) findResultsForProfile(profileID string, sessionResults *function.ProfilingSessionResults) *function.ResourceProfileResults {
	for _, r := range sessionResults.Results {
		if r.ResourceProfileId == profileID {
			return r
		}
	}
	return nil
}
