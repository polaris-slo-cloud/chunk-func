package profile

import (
	"fmt"

	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
)

const (
	awsMemoryStep int64 = 64
)

var (
	// Defines the memory-to-milliCPU steps.
	// Every item defines the maximum memory size for a particular CPU config.
	awsMilliCpuUpToMemory = []*memoryCpuPair{
		{memoryMiB: 1769, milliCpu: 1000}, // Up to 1769MiB memory we get 1000 milliCPU
		{memoryMiB: 3538, milliCpu: 2000}, // From 1780MiB to 3538MiB we get 2000 milliCPU
		{memoryMiB: 5307, milliCpu: 3000},
		{memoryMiB: 7076, milliCpu: 4000},
		{memoryMiB: 8845, milliCpu: 5000},
		{memoryMiB: 10240, milliCpu: 6000},
	}

	awsCosts = []*memoryCostPair{
		{memoryMiB: 128, pricePerUnit: 0.0000000021},
		{memoryMiB: 512, pricePerUnit: 0.0000000083},
		{memoryMiB: 1024, pricePerUnit: 0.0000000167},
		{memoryMiB: 1536, pricePerUnit: 0.0000000250},
		{memoryMiB: 2048, pricePerUnit: 0.0000000333},
		{memoryMiB: 3072, pricePerUnit: 0.0000000500},
		{memoryMiB: 4096, pricePerUnit: 0.0000000667},
		{memoryMiB: 5120, pricePerUnit: 0.0000000833},
		{memoryMiB: 6144, pricePerUnit: 0.0000001000},
		{memoryMiB: 7168, pricePerUnit: 0.0000001167},
		{memoryMiB: 8192, pricePerUnit: 0.0000001333},
		{memoryMiB: 9216, pricePerUnit: 0.0000001500},
		{memoryMiB: 10240, pricePerUnit: 0.0000001667},
	}
)

// Gets a list of resource profiles that are available on the underlying platform.
//
// Returns a list of profiles based on AWS Lambda, which (as of Feb 10, 2024) supports memory sizes
// from 128 MB to 10240 MB in 1 MB increments (https://docs.aws.amazon.com/lambda/latest/dg/configuration-function-common.html#configuration-memory-console)
// and uses 1ms billing units (https://aws.amazon.com/lambda/pricing/)
// We increase memory granularity and go with 64 MB increments.
// We interpolate prices linearly between the steps listed in the above link.
//
// Since we could not find an official documentation on the memory-to-CPU mapping,
// we assign the CPU cores based on a presentation from AWS re:Invent 2020 (https://www.youtube.com/watch?v=aW5EtKHTMuQ&t=339s).
func GetAvailableAWSResourceProfiles() []*function.ResourceProfile {
	minMemoryMiB := awsCosts[0].memoryMiB
	maxMemoryMiB := awsCosts[len(awsCosts)-1].memoryMiB
	resProfilesCount := (maxMemoryMiB-minMemoryMiB)/awsMemoryStep + 1
	resProfiles := make([]*function.ResourceProfile, resProfilesCount)

	for i := int64(0); i < resProfilesCount; i++ {
		memoryMiB := minMemoryMiB + awsMemoryStep*i
		resProfiles[i] = &function.ResourceProfile{
			ResourceConfiguration: function.ResourceConfiguration{
				MemoryMiB: memoryMiB,
				MilliCpu:  getAwsMilliCpu(memoryMiB),
			},
			PricePerUnit:  getAwsPricePerUnit(memoryMiB),
			BillingUnitMs: 1,
		}
	}

	return resProfiles
}

func getAwsMilliCpu(memoryMiB int64) int64 {
	if _, item := findMemoryItem(awsMilliCpuUpToMemory, memoryMiB); item != nil {
		return item.milliCpu
	}
	panic(fmt.Sprintf("Specified memory size %v exceeds maximum supported memory size %v", memoryMiB, awsMilliCpuUpToMemory[len(awsMilliCpuUpToMemory)-1]))
}

func getAwsPricePerUnit(memoryMiB int64) float64 {
	index, upper := findMemoryItem(awsCosts, memoryMiB)
	if upper == nil {
		panic(fmt.Sprintf("Specified memory size %v exceeds maximum supported memory size %v", memoryMiB, awsCosts[len(awsCosts)-1].memoryMiB))
	}

	// If we have hit an exact memory size from the list, we can return that cost.
	if upper.memoryMiB == memoryMiB {
		return upper.pricePerUnit
	}

	// Otherwise, we need to interpolate
	if index == 0 {
		panic(fmt.Sprintf("Specified memory size %v is below the minimum supported memory size %v", memoryMiB, awsCosts[0].memoryMiB))
	}
	lower := awsCosts[index-1]

	memoryDiff := float64(upper.memoryMiB - lower.memoryMiB)
	costDiff := float64(upper.pricePerUnit - lower.pricePerUnit)
	memorySurplusPercentage := float64(memoryMiB-lower.memoryMiB) / memoryDiff
	cost := lower.pricePerUnit + costDiff*memorySurplusPercentage
	return cost
}
