package controller

import (
	"context"

	core "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/util/uuid"
)

type NamespaceManager interface {

	// Creates a new namespace with a random name for profiling.
	CreateProfilingNamespace(ctx context.Context) (*core.Namespace, error)

	// Deletes an existing profiling namespace.
	DeleteProfilingNamespace(ctx context.Context, profilingNamespace *core.Namespace) error
}

func generateRandomNamespace() string {
	return string(uuid.NewUUID())
}
