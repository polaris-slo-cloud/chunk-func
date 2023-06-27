package profile

import (
	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
)

// Gets a list of resource profiles that are available on the underlying platform.
//
// Currently returns a list of profiles based on
// https://cloud.google.com/functions/docs/configuring/memory
// and https://cloud.google.com/functions/pricing (tier 2 prices)
func GetAvailableResourceProfiles() []*function.ResourceProfile {
	return []*function.ResourceProfile{
		{
			MemoryMiB:  128,
			MilliCpu:   83,
			Price100Ms: 0.000000324,
		},
		{
			MemoryMiB:  256,
			MilliCpu:   167,
			Price100Ms: 0.000000648,
		},
		{
			MemoryMiB:  512,
			MilliCpu:   333,
			Price100Ms: 0.000001295,
		},
		{
			MemoryMiB:  1024,
			MilliCpu:   583,
			Price100Ms: 0.000002310,
		},
		{
			MemoryMiB:  2048,
			MilliCpu:   1000,
			Price100Ms: 0.000004060,
		},
		{
			MemoryMiB:  4096,
			MilliCpu:   2000,
			Price100Ms: 0.000008120,
		},
		{
			MemoryMiB:  8192,
			MilliCpu:   2000,
			Price100Ms: 0.000009520,
		},
		{
			MemoryMiB:  16384,
			MilliCpu:   4000,
			Price100Ms: 0.000190400,
		},
	}
}
