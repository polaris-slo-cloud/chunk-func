package profile

import "sort"

var (
	_ memoryToPropertyMapper = (*memoryCpuPair)(nil)
	_ memoryToPropertyMapper = (*memoryCostPair)(nil)
)

// Interface to be implemented by structs that map a memory size to a property such as milliCPU or cost for resource profiles.
type memoryToPropertyMapper interface {
	MemoryMiB() int64
}

type memoryCpuPair struct {
	memoryMiB int64
	milliCpu  int64
}

type memoryCostPair struct {
	memoryMiB    int64
	pricePerUnit float64
}

func (mCpuP *memoryCpuPair) MemoryMiB() int64 {
	return mCpuP.memoryMiB
}

func (mCostP *memoryCostPair) MemoryMiB() int64 {
	return mCostP.memoryMiB
}

// Returns the lowest index i and item from the list, such that list[i].MemoryMiB() >= memoryMiB.
// If no such item exists, the function returns -1, nil
func findMemoryItem[T memoryToPropertyMapper](list []T, memoryMiB int64) (int, T) {
	index := sort.Search(
		len(list),
		func(i int) bool { return list[i].MemoryMiB() >= memoryMiB },
	)

	if index < len(list) {
		return index, list[index]
	}
	var nilValue T
	return -1, nilValue
}
