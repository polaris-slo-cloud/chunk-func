package function

// Describes an input for a serverless function.
type FunctionInput struct {
	// The size of the input in bytes.
	SizeBytes int64 `json:"sizeBytes" yaml:"sizeBytes"`

	// The message that will be sent to the function's endpoint to trigger it with the input of the specified size.
	//
	// This must be a complete message for the function's endpoint and it must reference the input of the specified size.
	//
	// +kubebuilder:pruning:PreserveUnknownFields
	Message map[string]interface{} `json:"message" yaml:"message"`
}
