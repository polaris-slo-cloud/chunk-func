package function

// Represents a set of configuration parameters for a serverless function.
type ResourceProfile struct {
	// The amount of memory for a single function instance in MiB.
	MemoryMiB int64 `json:"memoryMiB" yaml:"memoryMiB"`

	// The amount of milli CPU cores for a single function instance.
	MilliCpu int64 `json:"milliCpu" yaml:"milliCpu"`

	// The price for this configuration for 100ms of uptime.
	Price100Ms float64 `json:"price100Ms" yaml:"price100Ms"`
}
