package kubeutil

import (
	core "k8s.io/api/core/v1"
)

// Returns the container with the specified name or nil, if it cannot be found.
func FindContainer(containers []core.Container, name string) *core.Container {
	for i := range containers {
		curr := &containers[i]
		if curr.Name == name {
			return curr
		}
	}
	return nil
}
