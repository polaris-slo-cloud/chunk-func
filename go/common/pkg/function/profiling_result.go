package function

import (
	"sort"

	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// Describes the deployment status of a function under a specific resource profile.
type FunctionDeploymentStatus string

const (
	// Pseudo StatusCode to indicate that the function did not respond before the timeout.
	TimeoutStatusCode = -1

	DeploymentSuccess  FunctionDeploymentStatus = "Success"
	DeploymentFailed   FunctionDeploymentStatus = "Failed"
	DeploymentTimedOut FunctionDeploymentStatus = "Timeout"
)

// Collects the result of a single profiling session.
//
// +kubebuilder:object:generate=true
type ProfilingResult struct {
	// The HTTP status code returned by the function execution.
	// If the function is not triggered via REST, this contains the
	// exit code of the function converted into an HTTP status code.
	StatusCode int32 `json:"statusCode" yaml:"statusCode"`

	// The execution time of the function in milliseconds.
	ExecutionTimeMs int64 `json:"executionTimeMs" yaml:"executionTimeMs"`

	// The size of the used input in bytes.
	InputSizeBytes int64 `json:"inputSizeBytes" yaml:"inputSizeBytes"`
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
	// This is only present if DeploymentStatus is DeploymentSuccess.
	//
	// +optional
	Results []*ProfilingResult `json:"results" yaml:"results"`
}

// A collection of profiling results from a complete profiling session.
//
// +kubebuilder:object:generate=true
type ProfilingSessionResults struct {

	// The time when the profiling session started.
	ProfilingStarted *meta.Time `json:"profilingStarted" yaml:"profilingStarted"`

	// The number of seconds that the profiling session lasted.
	ProfilingDurationSeconds int32 `json:"profilingDurationSeconds" yaml:"profilingDurationSeconds"`

	// The list of results grouped by ResourceProfiles, ordered by increasing cost.
	Results []*ResourceProfileResults `json:"results" yaml:"results"`
}

// Returns the result that exactly matches the specified input size or nil.
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
