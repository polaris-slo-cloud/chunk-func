package function

import (
	"sort"

	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// Collects the result of a single profiling session.
type ProfilingResult struct {
	// The HTTP status code returned by the function execution.
	// If the function is not triggered via REST, this contains the
	// exit code of the function converted into an HTTP status code.
	StatusCode int32 `json:"statusCode" yaml:"statusCode"`

	// The execution time of the function in milliseconds.
	//
	// If the function execution resulted in an error, this value is -1.
	ExecutionTimeMs int64 `json:"executionTimeMs" yaml:"executionTimeMs"`

	// The size of the used input in bytes.
	InputSizeBytes int64 `json:"inputSizeBytes" yaml:"inputSizeBytes"`
}

// Collects all profiling results for a ResourceProfile.
type ResourceProfileResults struct {

	// The ID of the ResourceProfile that was used for this profiling session.
	ResourceProfileId string `json:"resourceProfileId" yaml:"resourceProfileId"`

	// The profiling results ordered by increasing input size.
	Results []*ProfilingResult `json:"results" yaml:"results"`
}

// A collection of profiling results from a complete profiling session.
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
