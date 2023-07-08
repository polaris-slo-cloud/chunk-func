/*
Copyright 2023 Polaris SLO Cloud.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package v1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
)

// IMPORTANT: Run "make manifests" to regenerate code after modifying this file

// FunctionDescriptionSpec defines the desired state of FunctionDescription
type FunctionDescriptionSpec struct {

	// Collects information about a serverless function, such as
	// its typical inputs for profiling or its response time SLO
	FunctionDescription function.FunctionDescription `json:",inline"`
}

// FunctionDescriptionStatus defines the observed state of FunctionDescription
type FunctionDescriptionStatus struct {
	// The results of the profiling session.
	// +optional
	ProfilingResults *function.ProfilingSessionResults `json:"profilingResults,omitempty"`

	// The function configurations optimized using the profiling results.
	// This array, if set, contains one entry for each function input size.
	// +optional
	OptimizedConfigs []*function.OptimizedFunctionConfig `json:"optimizedConfigs,omitempty"`
}

//+kubebuilder:object:root=true
//+kubebuilder:subresource:status

// FunctionDescription is the Schema for the functiondescriptions API
type FunctionDescription struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   FunctionDescriptionSpec   `json:"spec,omitempty"`
	Status FunctionDescriptionStatus `json:"status,omitempty"`
}

//+kubebuilder:object:root=true

// FunctionDescriptionList contains a list of FunctionDescription
type FunctionDescriptionList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []FunctionDescription `json:"items"`
}

func init() {
	SchemeBuilder.Register(&FunctionDescription{}, &FunctionDescriptionList{})
}
