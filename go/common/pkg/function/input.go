package function

import (
	"bytes"
	"encoding/json"
	"fmt"

	"k8s.io/apimachinery/pkg/runtime"
)

// Describes an input for a serverless function.
type FunctionInput struct {
	// The size of the input in bytes.
	SizeBytes int64 `json:"sizeBytes" yaml:"sizeBytes"`

	// The message that will be sent to the function's endpoint to trigger it with the input of the specified size.
	//
	// This must be a complete message for the function's endpoint and it must reference the input of the specified size.
	//
	// +kubebuilder:pruning:PreserveUnknownFields
	Message *runtime.RawExtension `json:"message" yaml:"message"`
}

// Returns a deep copy of the Message field converted into a map[string]interface{}.
func (fi *FunctionInput) MessageAsMap() (map[string]interface{}, error) {
	if fi.Message == nil {
		return nil, fmt.Errorf("the FunctionInput.Message field is nil")
	}

	rawJson, err := fi.Message.MarshalJSON()
	if err != nil {
		return nil, err
	}

	ret := make(map[string]interface{})
	err = json.Unmarshal(rawJson, &ret)
	if err != nil {
		return nil, err
	}

	return ret, nil
}

// Returns a deep copy of the message field as a Buffer containing a JSON string.
func (fi *FunctionInput) MessageAsJsonBuffer() (*bytes.Buffer, error) {
	if fi.Message == nil {
		return nil, fmt.Errorf("the FunctionInput.Message field is nil")
	}

	buf, err := fi.Message.MarshalJSON()
	if err != nil {
		return nil, err
	}

	return bytes.NewBuffer(buf), nil
}
