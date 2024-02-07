package function

import (
	"sort"

	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// Describes the deployment status of a function under a specific resource profile.
type FunctionDeploymentStatus string

// Describes whether a profiling result is the result of a profiling run or of model inference.
type ProfilingResultType string

const (
	// Pseudo StatusCode to indicate that the function did not respond before the timeout.
	TimeoutStatusCode = -1

	DeploymentSuccess  FunctionDeploymentStatus = "Success"
	DeploymentFailed   FunctionDeploymentStatus = "Failed"
	DeploymentTimedOut FunctionDeploymentStatus = "Timeout"

	ProfilingResultProfiled ProfilingResultType = "Profiled"
	ProfilingResultInferred ProfilingResultType = "Inferred"
)

// Collects the result of a single profiling session.
//
// +kubebuilder:object:generate=true
type ProfilingResult struct {
	// The HTTP status code returned by the function execution.
	// If the function is not triggered via REST, this contains the
	// exit code of the function converted into an HTTP status code.
	StatusCode int32 `json:"statusCode" yaml:"statusCode"`

	// Describes whether the profiling result is the result of
	// a profiling run or of model inference.
	// If this is not set, the result comes from profiling.
	//
	// +optional
	ResultType *ProfilingResultType `json:"resultType" yaml:"resultType"`

	// The execution time of the function in milliseconds.
	ExecutionTimeMs int64 `json:"executionTimeMs" yaml:"executionTimeMs"`

	// The size of the used input in bytes.
	InputSizeBytes int64 `json:"inputSizeBytes" yaml:"inputSizeBytes"`

	// The total cost incurred by a single execution of the function with the used resource profile.
	// This serves purely informational purposes and is not used by the chunk-func controller.
	//
	// +optional
	ExecutionCost *string `json:"executionCost" yaml:"executionCost"`
}

// Collects all profiling results for a ResourceProfile.
//
// +kubebuilder:object:generate=true
type ResourceProfileResults struct {

	// The ID of the ResourceProfile that was used for this profiling session.
	ResourceProfileId string `json:"resourceProfileId" yaml:"resourceProfileId"`

	// Indicates if a test function was successfully deployed with this resource profile.
	DeploymentStatus FunctionDeploymentStatus `json:"deploymentStatus" yaml:"deploymentStatus"`

	// The profiling results ordered by increasing input size.
	//
	// Only successful results are contained in this list, i.e., if
	// there was no successful run for a particular input size, this input size
	// is not present in this list.
	//
	// Note 1: This is only present if DeploymentStatus is DeploymentSuccess.
	// Note 2: If none of the profiling runs was successful, this list is empty.
	//
	// +optional
	Results []*ProfilingResult `json:"results" yaml:"results"`

	// The unfiltered profiling results ordered by increasing input size.
	//
	// Unfiltered means that also input sizes with only failed runs are included.
	// This is present for debugging purposes.
	//
	// If DeploymentStatus is not DeploymentSuccess, this is nil.
	//
	// +optional
	UnfilteredResults []*ProfilingResult `json:"unfilteredResults" yaml:"unfilteredResults"`
}

// A collection of profiling results from a complete profiling session.
//
// +kubebuilder:object:generate=true
type ProfilingSessionResults struct {

	// The time when the profiling session started.
	ProfilingStarted *meta.Time `json:"profilingStarted" yaml:"profilingStarted"`

	// The number of seconds that the profiling session lasted.
	ProfilingDurationSeconds int32 `json:"profilingDurationSeconds" yaml:"profilingDurationSeconds"`

	// The number of ResourceProfile-InputSize combinations (= configurations) that were profiled.
	ConfigurationsProfiled int32 `json:"configurationsProfiled" yaml:"configurationsProfiled"`

	// The number of ResourceProfile-InputSize combinations (= configurations) that were inferred instead of profiled.
	ConfigurationsInferred int32 `json:"configurationsInferred" yaml:"configurationsInferred"`

	// The list of results grouped by ResourceProfiles, ordered by increasing memory size and base cost (price per 100ms).
	Results []*ResourceProfileResults `json:"results" yaml:"results"`
}

// Returns the result that matches the specified input size or nil.
func (rpr *ResourceProfileResults) FindResultForInputSize(inputSizeBytes int64) *ProfilingResult {
	index := sort.Search(
		len(rpr.Results),
		func(i int) bool { return rpr.Results[i].InputSizeBytes >= inputSizeBytes },
	)

	if index < len(rpr.Results) {
		result := rpr.Results[index]
		if result.InputSizeBytes == inputSizeBytes {
			return result
		}
	}
	return nil
}
