package function

// Collects the result of a single profiling session.
type ProfilingResult struct {
	// The execution time of the function in milliseconds.
	ExecutionTimeMs int64 `json:"executionTimeMs" yaml:"executionTimeMs"`

	// The size of the used input in bytes.
	InputSizeBytes int64 `json:"inputSizeBytes" yaml:"inputSizeBytes"`
}

// Collects all profiling results for a ResourceProfile.
type ResourceProfileResults struct {

	// The ResourceProfile that was used for this profiling session.
	ResourceProfile *ResourceProfile `json:"resourceProfile" yaml:"resourceProfile"`

	// The profiling results ordered by increasing input size.
	Results []*ProfilingResult `json:"results" yaml:"results"`
}

// A collection of profiling results from a complete profiling session.
type ProfilingSessionResults struct {

	// The list of results grouped by ResourceProfiles.
	Results []*ResourceProfileResults `json:"results" yaml:"results"`
}
