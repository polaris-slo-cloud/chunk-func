package function

import (
	kn "knative.dev/client-pkg/pkg/apis"
)

// Represents a set of configuration parameters for a serverless function.
type ExecutionProfile struct {
	// The amount of memory for a single function instance in MiB.
	MemoryMiB int64

	// The amount of milli CPU cores for a single function instance.
	MilliCpu int64

	Test kn.Service
}
