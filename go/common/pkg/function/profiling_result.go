package function

// Collects the result of a single profiling session.
type ProfilingResult struct {
	// The execution time of the function in milliseconds.
	ExecutionTimeMs int64 `json:"executionTimeMs" yaml:"executionTimeMs"`

	// The ResourceProfile that was used for this profiling session.
	ResourceProfile *ResourceProfile `json:"resourceProfile" yaml:"resourceProfile"`
}

// A collection of profiling results from a complete profiling session.
type ProfilingResults struct {

	// The list of results.
	Results []*ProfilingResult `json:"results" yaml:"results"`
}
