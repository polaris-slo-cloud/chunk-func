package function

// A function configuration for a specific input size, optimized for a specific purpose.
//
// +kubebuilder:object:generate=true
type OptimizedFunctionConfig struct {
	// Describes the objective of the optimization.
	OptimizedFor string `json:"optimizedFor" yaml:"optimizedFor"`

	// The size of the input, for which this configuration is intended.
	InputSizeBytes int64 `json:"inputSizeBytes" yaml:"inputSizeBytes"`

	// The resource configuration.
	// If no resources profile meets the SLO for the input size, this is nil.
	Config *ResourceConfiguration `json:"config" yaml:"config"`
}
