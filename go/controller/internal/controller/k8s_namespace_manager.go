package controller

import (
	"context"

	core "k8s.io/api/core/v1"
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

var (
	_ NamespaceManager = (*K8sNamespaceManager)(nil)
)

// The default NamespaceManager that creates and deletes namespaces for profiling.
type K8sNamespaceManager struct {
	k8sClient client.Client
}

func NewK8sNamespaceManager(k8sClient client.Client) *K8sNamespaceManager {
	return &K8sNamespaceManager{
		k8sClient: k8sClient,
	}
}

func (knm *K8sNamespaceManager) CreateProfilingNamespace(ctx context.Context) (*core.Namespace, error) {
	profilingNamespace := core.Namespace{
		ObjectMeta: meta.ObjectMeta{
			Name: generateRandomNamespace(),
		},
		Spec: core.NamespaceSpec{},
	}

	if err := knm.k8sClient.Create(ctx, &profilingNamespace); err != nil {
		return nil, err
	}
	return &profilingNamespace, nil
}

func (knm *K8sNamespaceManager) DeleteProfilingNamespace(ctx context.Context, profilingNamespace *core.Namespace) error {
	return knm.k8sClient.Delete(ctx, profilingNamespace)
}
