package controller

import (
	"context"

	core "k8s.io/api/core/v1"
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var (
	_ NamespaceManager = (*MockedNamespaceManager)(nil)
)

// NamespaceManager to be used in combination with the MockedResultsTrigger.
// This manager does not create or delete any namespaces in K8s, it just returns mocked namespaces.
type MockedNamespaceManager struct {
}

func NewMockedNamespaceManager() *MockedNamespaceManager {
	return &MockedNamespaceManager{}
}

func (knm *MockedNamespaceManager) CreateProfilingNamespace(ctx context.Context) (*core.Namespace, error) {
	profilingNamespace := core.Namespace{
		ObjectMeta: meta.ObjectMeta{
			Name: generateRandomNamespace(),
		},
		Spec: core.NamespaceSpec{},
	}
	return &profilingNamespace, nil
}

func (knm *MockedNamespaceManager) DeleteProfilingNamespace(ctx context.Context, profilingNamespace *core.Namespace) error {
	return nil
}
