package function

import (
	knServing "knative.dev/serving/pkg/apis/serving/v1"
)

// Collects information about a serverless function, such as
// its typical inputs for profiling or its response time SLO.
type FunctionDescription struct {

	// The name of the function. This must be the name of a Knative Service object
	// in the same namespace as the FunctionDescription.
	FunctionName string `json:"functionName" yaml:"functionName"`

	// The name of the container in the pod that hosts the function code.
	FunctionContainer string `json:"functionContainer" yaml:"functionContainer"`

	// The typical inputs of various sizes.
	TypicalInputs []FunctionInput `json:"typicalInputs" yaml:"typicalInputs"`

	// The SLO that describes the maximum allowed response time (in milliseconds) for this function.
	MaxResponseTimeMs int64 `json:"maxResponseTimeMs" yaml:"maxResponseTimeMs"`
}

// Combines a reference to a function Service with the description of the ChunkFunc function.
type FunctionWithDescription struct {

	// The serverless function object stored in Kubernetes.
	Function *knServing.Service

	// The ChunkFunc description of the function.
	Description *FunctionDescription
}
