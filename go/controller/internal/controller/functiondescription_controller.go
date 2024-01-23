/*
Copyright 2023 Polaris SLO Cloud.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package controller

import (
	"context"
	"time"

	core "k8s.io/api/core/v1"
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/util/uuid"
	knServing "knative.dev/serving/pkg/apis/serving/v1"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"

	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
	chunkFunc "polaris-slo-cloud.github.io/chunk-func/controller/api/v1"
	"polaris-slo-cloud.github.io/chunk-func/profiler/pkg/optimizer"
	"polaris-slo-cloud.github.io/chunk-func/profiler/pkg/profile"
	"polaris-slo-cloud.github.io/chunk-func/profiler/pkg/profiler"
)

var (
	_ reconcile.Reconciler = (*FunctionDescriptionReconciler)(nil)
)

// FunctionDescriptionReconciler reconciles a FunctionDescription object
type FunctionDescriptionReconciler struct {
	client.Client
	Scheme *runtime.Scheme

	fnProfiler  profiler.FunctionProfiler
	fnOptimizer optimizer.FunctionOptimizer
}

// Permissions on ChunkFunc FunctionDescriptions:
//+kubebuilder:rbac:groups=chunk-func.polaris-slo-cloud.github.io,resources=functiondescriptions,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=chunk-func.polaris-slo-cloud.github.io,resources=functiondescriptions/status,verbs=get;update;patch
//+kubebuilder:rbac:groups=chunk-func.polaris-slo-cloud.github.io,resources=functiondescriptions/finalizers,verbs=update

// Permissions on Knative Services:
//+kubebuilder:rbac:groups=serving.knative.dev,resources=services,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=serving.knative.dev,resources=services/status,verbs=get;update;patch

// Permissions on Namespaces:
//+kubebuilder:rbac:groups=core,resources=namespaces,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=core,resources=namespaces/status,verbs=get

// Reconcile is part of the main kubernetes reconciliation loop which aims to
// move the current state of the cluster closer to the desired state.
func (fdr *FunctionDescriptionReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := log.FromContext(ctx)

	var fnDesc chunkFunc.FunctionDescription
	if err := fdr.Get(ctx, req.NamespacedName, &fnDesc); err != nil {
		err = client.IgnoreNotFound(err)
		if err != nil {
			log.Error(err, "Unable to fetch FunctionDescription")
		} else {
			log.Info("FunctionDescription has been deleted")
		}
		return ctrl.Result{}, err
	}

	if len(fnDesc.Status.OptimizedConfigs) > 0 {
		log.Info("Function already profiled, skipping.", "name", fnDesc.Spec.FunctionDescription.FunctionName)
		return ctrl.Result{}, nil
	}

	knSvc, err := fdr.fetchKnativeService(ctx, &fnDesc)
	if err != nil {
		log.Error(err, "Unable to fetch Knative Service", "name", fnDesc.Spec.FunctionDescription.FunctionName)
		return ctrl.Result{}, err
	}

	fnWidthDesc := &function.FunctionWithDescription{
		Function:    knSvc,
		Description: &fnDesc.Spec.FunctionDescription,
	}

	profilingNamespace, err := fdr.createProfilingNamespace(ctx)
	if err != nil {
		log.Error(err, "Unable to create profiling namespace", "namespace", profilingNamespace)
		return ctrl.Result{}, err
	}
	defer fdr.Delete(context.Background(), profilingNamespace)

	profilingResults, err := fdr.fnProfiler.ProfileFunction(ctx, fnWidthDesc, fdr.getProfilingConfig(profilingNamespace.Name))
	if err != nil {
		log.Error(err, "Error during profiling session")
		return ctrl.Result{}, err
	}

	log.Info("Profiling complete", "FunctionDescription", req.NamespacedName)

	optimizedConfigs, err := fdr.fnOptimizer.FindOptimizedConfigs(fnWidthDesc, profilingResults)
	if err != nil {
		log.Error(err, "Error while trying to find optimized configs")
		return ctrl.Result{}, err
	}

	fnDesc.Status.ProfilingResults = profilingResults
	fnDesc.Status.OptimizedConfigs = optimizedConfigs
	if err := fdr.Client.Status().Update(ctx, &fnDesc); err != nil {
		log.Error(err, "Error updating FunctionDescription")
		return ctrl.Result{}, err
	}

	return ctrl.Result{}, nil
}

// SetupWithManager sets up the controller with the Manager.
func (fdr *FunctionDescriptionReconciler) SetupWithManager(mgr ctrl.Manager) error {
	k8sConfig := mgr.GetConfig()
	profilerLog := mgr.GetLogger().WithName("profiler")
	fdr.fnProfiler = profiler.NewExhaustiveFunctionProfiler(k8sConfig, &profilerLog)
	fdr.fnOptimizer = optimizer.NewResponseTimeSloAndCostOptimizer()

	return ctrl.NewControllerManagedBy(mgr).
		For(&chunkFunc.FunctionDescription{}).
		Named("chunk-func-controller").
		Complete(fdr)
}

func (fdr *FunctionDescriptionReconciler) fetchKnativeService(ctx context.Context, fnDesc *chunkFunc.FunctionDescription) (*knServing.Service, error) {
	namespacedName := &client.ObjectKey{
		Namespace: fnDesc.Namespace,
		Name:      fnDesc.Spec.FunctionDescription.FunctionName,
	}
	var svc knServing.Service
	if err := fdr.Get(ctx, *namespacedName, &svc); err != nil {
		return nil, err
	}
	return &svc, nil
}

func (fdr *FunctionDescriptionReconciler) getProfilingConfig(profilingNamespace string) *profiler.ProfilingConfig {
	timeout, err := time.ParseDuration("2m")
	if err != nil {
		panic("error parsing FunctionReadyTimeout duration")
	}

	config := &profiler.ProfilingConfig{
		CandidateProfiles:            profile.GetAvailableResourceProfiles(),
		IterationsPerInputAndProfile: 5,
		ConcurrentProfiles:           3,
		ProfilingNamespace:           profilingNamespace,
		FunctionReadyTimeout:         timeout,
	}
	return config
}

func generateRandomNamespace() string {
	return string(uuid.NewUUID())
}

func (fdr *FunctionDescriptionReconciler) createProfilingNamespace(ctx context.Context) (*core.Namespace, error) {
	profilingNamespace := core.Namespace{
		ObjectMeta: meta.ObjectMeta{
			Name: generateRandomNamespace(),
		},
		Spec: core.NamespaceSpec{},
	}

	if err := fdr.Client.Create(ctx, &profilingNamespace); err != nil {
		return nil, err
	}
	return &profilingNamespace, nil
}
