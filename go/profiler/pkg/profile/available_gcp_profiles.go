package profile

import (
	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
)

// Gets a list of resource profiles that are available on the underlying platform.
//
// Returns a list of profiles based on Google Cloud Functions:
// https://cloud.google.com/functions/docs/configuring/memory
// and https://cloud.google.com/functions/pricing (tier 2 prices)
func GetAvailableGCFResourceProfiles() []*function.ResourceProfile {
	return []*function.ResourceProfile{
		{
			ResourceConfiguration: function.ResourceConfiguration{
				MemoryMiB: 128,
				MilliCpu:  83,
			},
			PricePerUnit:  0.000000324,
			BillingUnitMs: 100,
		},
		{
			ResourceConfiguration: function.ResourceConfiguration{
				MemoryMiB: 256,
				MilliCpu:  167,
			},
			PricePerUnit:  0.000000648,
			BillingUnitMs: 100,
		},
		{
			ResourceConfiguration: function.ResourceConfiguration{
				MemoryMiB: 512,
				MilliCpu:  333,
			},
			PricePerUnit:  0.000001295,
			BillingUnitMs: 100,
		},
		{
			ResourceConfiguration: function.ResourceConfiguration{
				MemoryMiB: 1024,
				MilliCpu:  583,
			},
			PricePerUnit:  0.000002310,
			BillingUnitMs: 100,
		},
		{
			ResourceConfiguration: function.ResourceConfiguration{
				MemoryMiB: 2048,
				MilliCpu:  1000,
			},
			PricePerUnit:  0.000004060,
			BillingUnitMs: 100,
		},
		{
			ResourceConfiguration: function.ResourceConfiguration{
				MemoryMiB: 4096,
				MilliCpu:  2000,
			},
			PricePerUnit:  0.000008120,
			BillingUnitMs: 100,
		},
		{
			ResourceConfiguration: function.ResourceConfiguration{
				MemoryMiB: 8192,
				MilliCpu:  2000,
			},
			PricePerUnit:  0.000009520,
			BillingUnitMs: 100,
		},
		{
			ResourceConfiguration: function.ResourceConfiguration{
				MemoryMiB: 16384,
				MilliCpu:  4000,
			},
			PricePerUnit:  0.000190400,
			BillingUnitMs: 100,
		},
	}
}
