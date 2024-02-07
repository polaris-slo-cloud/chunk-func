package kubeutil

import (
	"fmt"
	"math"
	"sync"
)

// Provides collision-free names for objects in the same namespace that would otherwise have the same name.
// This is needed, because parallel profiling may try to create multiple objects with the same name.
// All methods are thread-safe
type ObjectNameTracker struct {

	// Set of existing object names.
	existingObjects map[string]bool

	existingObjectsMutex sync.Mutex
}

func NewObjectNameTracker() *ObjectNameTracker {
	return &ObjectNameTracker{
		existingObjects:      make(map[string]bool),
		existingObjectsMutex: sync.Mutex{},
	}
}

func (ont *ObjectNameTracker) GetNewObjectName(proposedName string) string {
	ont.existingObjectsMutex.Lock()
	defer ont.existingObjectsMutex.Unlock()

	for i := range math.MaxInt32 {
		name := fmt.Sprintf("%s-%v", proposedName, i)
		if _, exists := ont.existingObjects[name]; !exists {
			ont.existingObjects[name] = true
			return name
		}
	}
	panic("Could not find a unique name for object after 2 billion tries")
}

func (ont *ObjectNameTracker) ReleaseObjectName(name string) {
	ont.existingObjectsMutex.Lock()
	defer ont.existingObjectsMutex.Unlock()
	delete(ont.existingObjects, name)
}
