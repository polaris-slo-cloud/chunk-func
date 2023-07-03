package profiler

import (
	"context"
	"fmt"
	"time"

	core "k8s.io/api/core/v1"
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
	knApis "knative.dev/pkg/apis"
	knServing "knative.dev/serving/pkg/apis/serving/v1"

	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
	"polaris-slo-cloud.github.io/chunk-func/common/pkg/kubeutil"
)

// Returns nil if the service is completely valid, otherwise an error.
func CheckKnativeServiceIsValid(fn *function.FunctionWithDescription) error {
	if kubeutil.FindContainer(fn.Function.Spec.Template.Spec.Containers, fn.Description.FunctionContainer) == nil {
		return fmt.Errorf("The Knative Service %s does not contain a container %s", fn.Function.Name, fn.Description.FunctionContainer)
	}
	return nil
}

// Creates a new Knative service with the specified resource profile in the target namespace.
func CreateKnativeServiceWithProfile(
	fn *function.FunctionWithDescription,
	targetNamespace string,
	resourceProfile *function.ResourceProfile,
) (*knServing.Service, error) {
	ret := &knServing.Service{
		ObjectMeta: meta.ObjectMeta{
			Namespace: targetNamespace,
			Name:      fn.Function.Name + "-" + resourceProfile.StringifyForK8sObj(),
		},
		Spec: *fn.Function.Spec.DeepCopy(),
	}

	container := kubeutil.FindContainer(ret.Spec.Template.Spec.Containers, fn.Description.FunctionContainer)
	if container == nil {
		return nil, fmt.Errorf("The Knative Service %s does not contain a container %s", fn.Function.Name, fn.Description.FunctionContainer)
	}
	container.Resources.Limits[core.ResourceCPU] = *resourceProfile.CpuAsQuantity()
	container.Resources.Limits[core.ResourceMemory] = *resourceProfile.MemoryAsQuantity()

	return ret, nil
}

// Casts the specified obj to a Knative Service or panics.
func CoerceToKnativeServiceOrPanic(obj interface{}) *knServing.Service {
	service, ok := obj.(*knServing.Service)
	if !ok {
		panic("Knative Service watch received a non Service object")
	}
	return service
}

// Returns true if the service is ready.
func IsKnativeServiceReady(svc *knServing.Service) bool {
	for _, cond := range svc.Status.Conditions {
		if cond.Type == knApis.ConditionReady {
			return true
		}
	}
	return false
}

// Creates a new service for the specified resource profile and waits for it to be ready.
//
// Important: If there is an error when waiting for the service to become ready,
// BOTH a service AND an error are returned. The caller must ensure that the service gets deleted again.
func (pr *exhaustiveFunctionProfilerSession) CreateAndWaitForService(
	ctx context.Context,
	fn *function.FunctionWithDescription,
	targetNamespace string,
	resourceProfile *function.ResourceProfile,
	deploymentMgr FunctionDeploymentManager,
	timeout time.Duration,
) (*knServing.Service, error) {
	svc, err := CreateKnativeServiceWithProfile(fn, targetNamespace, resourceProfile)
	if err != nil {
		return nil, err
	}

	deployedSvc, err := deploymentMgr.DeployFunction(ctx, svc)
	if err != nil {
		return nil, err
	}

	err = deploymentMgr.WaitForFunctionToBeReady(ctx, deployedSvc, timeout)
	return svc, err
}
