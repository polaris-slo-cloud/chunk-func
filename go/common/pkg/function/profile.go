package function

import (
	"fmt"

	"k8s.io/apimachinery/pkg/api/resource"
)

// Represents a set of resource configuration parameters for a serverless function.
//
// +kubebuilder:object:generate=true
type ResourceConfiguration struct {
	// The amount of memory for a single function instance in MiB.
	MemoryMiB int64 `json:"memoryMiB" yaml:"memoryMiB"`

	// The amount of milli CPU cores for a single function instance.
	MilliCpu int64 `json:"milliCpu" yaml:"milliCpu"`
}

// Represents a set of resource configuration parameters for a serverless function and the associated cost.
// This is a distinct struct to keep the price floating point number out of the ResourceConfiguration to
// allow it to be easily stored in a CRD.
type ResourceProfile struct {
	// The resource configuration parameters.
	ResourceConfiguration `json:",inline" yaml:",inline"`

	// The price for this configuration for 100ms of uptime.
	Price100Ms float64 `json:"price100Ms" yaml:"price100Ms"`
}

// Returns a unique ID for this resource profile that can be used, e.g., as a map key.
func (rp *ResourceProfile) ID() string {
	return rp.StringifyForK8sObj()
}

// Returns a string with details about this profile, which can be appended to a Kubernetes object name,
// e.g., "1024MiB-1000m".
func (rp *ResourceProfile) StringifyForK8sObj() string {
	return fmt.Sprintf("%dMiB-%dm", rp.MemoryMiB, rp.MilliCpu)
}

// Returns the MilliCpu field as a resource.Quantity object.
func (rp *ResourceProfile) CpuAsQuantity() *resource.Quantity {
	return resource.NewMilliQuantity(rp.MilliCpu, resource.DecimalSI)
}

// Returns the MemoryMiB field as a resource.Quantity object.
func (rp *ResourceProfile) MemoryAsQuantity() *resource.Quantity {
	return resource.NewScaledQuantity(rp.MemoryMiB, resource.Mega)
}
