package profile

import (
	"polaris-slo-cloud.github.io/chunk-func/common/pkg/collections"
	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
)

var (
	resourceProfileListFactories = map[string]AvailableResourceProfilesFactoryFn{
		"AWS": GetAvailableAWSResourceProfiles,
		"GCF": GetAvailableGCFResourceProfiles,
	}
)

// Defines a factory function that returns a list of ResourceProfiles that are available on the underlying platform.
type AvailableResourceProfilesFactoryFn func() []*function.ResourceProfile

// Returns the AvailableResourceProfilesFactoryFn that corresponds to the specified type
// or nil if the type is invalid.
func GetAvailableResourceProfilesFactory(resProfilesType string) AvailableResourceProfilesFactoryFn {
	if factoryFn, ok := resourceProfileListFactories[resProfilesType]; ok {
		return factoryFn
	}
	return nil
}

// Gets a list of supported resource profile factories.
func GetSupportedResourceProfileTypes() []string {
	return collections.GetMapKeys(resourceProfileListFactories)
}
