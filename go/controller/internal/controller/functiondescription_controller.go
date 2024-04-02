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
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/go-logr/logr"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/rest"
	knServing "knative.dev/serving/pkg/apis/serving/v1"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"

	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
	chunkFunc "polaris-slo-cloud.github.io/chunk-func/controller/api/v1"
	"polaris-slo-cloud.github.io/chunk-func/controller/internal/util"
	"polaris-slo-cloud.github.io/chunk-func/profiler/pkg/optimizer"
	"polaris-slo-cloud.github.io/chunk-func/profiler/pkg/profile"
	"polaris-slo-cloud.github.io/chunk-func/profiler/pkg/profiler"
	"polaris-slo-cloud.github.io/chunk-func/profiler/pkg/trigger"
)

var (
	_ reconcile.Reconciler = (*FunctionDescriptionReconciler)(nil)
)

// FunctionDescriptionReconciler reconciles a FunctionDescription object
type FunctionDescriptionReconciler struct {
	client.Client
	Scheme *runtime.Scheme

	getAvailableResourceProfiles profile.AvailableResourceProfilesFactoryFn
	fnProfiler                   profiler.FunctionProfiler
	fnOptimizer                  optimizer.FunctionOptimizer

	namespaceMgr NamespaceManager

	iterationsPerInputAndProfile int
	concurrentProfileEvaluations int
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

	log.Info("Starting profiling of function", "name", fnDesc.Spec.FunctionDescription.FunctionName)
	profilingNamespace, err := fdr.namespaceMgr.CreateProfilingNamespace(ctx)
	if err != nil {
		log.Error(err, "Unable to create profiling namespace", "namespace", profilingNamespace)
		return ctrl.Result{}, err
	}
	defer fdr.namespaceMgr.DeleteProfilingNamespace(context.Background(), profilingNamespace)

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
	if err := fdr.setUpResourceProfilesFactory(); err != nil {
		return err
	}
	if err := fdr.readProfilingConfigValues(); err != nil {
		return err
	}

	profilerLog := mgr.GetLogger().WithName("profiler")
	profiler, err := fdr.createProfiler(k8sConfig, &profilerLog)
	if err != nil {
		return err
	}
	fdr.fnProfiler = profiler
	fdr.fnOptimizer = optimizer.NewResponseTimeSloAndCostOptimizer(fdr.getAvailableResourceProfiles())

	return ctrl.NewControllerManagedBy(mgr).
		For(&chunkFunc.FunctionDescription{}).
		Named("chunk-func-controller").
		Complete(fdr)
}

func (fdr *FunctionDescriptionReconciler) createProfiler(k8sConfig *rest.Config, logger *logr.Logger) (profiler.FunctionProfiler, error) {
	fnTriggerFactory, deploymentMgrFactory, err := fdr.createDeploymentAndTriggerFactories(logger)
	if err != nil {
		return nil, err
	}

	profilerType := strings.ToLower(os.Getenv("PROFILER"))
	switch profilerType {
	case "bayesianopt":
		return fdr.createBoFunctionProfiler(k8sConfig, fnTriggerFactory, deploymentMgrFactory, logger)
	case "exhaustive":
		fallthrough
	default:
		logger.Info("Creating ExhaustiveFunctionProfiler")
		return profiler.NewExhaustiveFunctionProfiler(k8sConfig, fnTriggerFactory, deploymentMgrFactory, logger), nil
	}
}

func (fdr *FunctionDescriptionReconciler) createDeploymentAndTriggerFactories(logger *logr.Logger) (trigger.TimedFunctionTriggerFactoryFn[any], profiler.FunctionDeploymentManagerFactoryFn, error) {
	triggerType := strings.ToLower(os.Getenv("FUNCTION_TRIGGER"))
	switch triggerType {
	case "mockedresults":
		mockResultsDir := "./config/mockedresults/" + strings.ToLower(os.Getenv("RESOURCE_PROFILES"))
		mockedResults, err := util.LoadMockedProfilingResults(mockResultsDir)
		if err != nil {
			return nil, nil, fmt.Errorf("error loading mocked profiling results from %s: %v", mockResultsDir, err)
		}
		logger.Info("Using MockedResultsTriggerFactory with", "mockedResults", len(mockedResults))
		fdr.namespaceMgr = NewMockedNamespaceManager()
		return trigger.NewMockedResultsTriggerFactory(mockedResults), profiler.NewMockedFunctionDeploymentManager, nil
	case "rest":
		fallthrough
	default:
		logger.Info("Using RestTriggerFactory")
		fdr.namespaceMgr = NewK8sNamespaceManager(fdr.Client)
		return trigger.RestTriggerFactory, profiler.NewFunctionDeploymentManager, nil
	}
}

func (fdr *FunctionDescriptionReconciler) createBoFunctionProfiler(
	k8sConfig *rest.Config,
	fnTriggerFactory trigger.TimedFunctionTriggerFactoryFn[any],
	deploymentMgrFactory profiler.FunctionDeploymentManagerFactoryFn,
	logger *logr.Logger,
) (*profiler.BayesianOptFunctionProfiler, error) {
	address := os.Getenv("BAYESIAN_OPT_SERVER")
	if address == "" {
		return nil, fmt.Errorf("the BAYESIAN_OPT_SERVER environment variable must be set to the address of the Bayesian Optimizer server, e.g., \"localhost:9000\"")
	}
	minSamplesPercent, err := util.GetFloatEnvVar("BAYESIAN_OPT_MIN_SAMPLES_PERCENT", &profiler.DefaultBoMinSamplesPercent)
	if err != nil {
		return nil, err
	}
	maxSamplesPercent, err := util.GetFloatEnvVar("BAYESIAN_OPT_MAX_SAMPLES_PERCENT", &profiler.DefaultBoMaxSamplesPercent)
	if err != nil {
		return nil, err
	}
	xi, err := util.GetFloatEnvVar("BAYESIAN_OPT_XI", &profiler.DefaultBoXi)
	if err != nil {
		return nil, err
	}
	poiThreshold, err := util.GetFloatEnvVar("BAYESIAN_OPT_POI_THRESHOLD", &profiler.DefaultBoPoiThreshold)
	if err != nil {
		return nil, err
	}

	logger.Info("Creating BayesianOptFunctionProfiler", "targetAddress", address)
	return profiler.NewBayesianOptFunctionProfiler(k8sConfig, address, fnTriggerFactory, deploymentMgrFactory, minSamplesPercent, maxSamplesPercent, xi, poiThreshold, logger), nil
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

func (fdr *FunctionDescriptionReconciler) setUpResourceProfilesFactory() error {
	resProfilesType := strings.ToUpper(os.Getenv("RESOURCE_PROFILES"))
	if resProfilesType != "" {
		if resProfilesFactory := profile.GetAvailableResourceProfilesFactory(resProfilesType); resProfilesFactory != nil {
			fdr.getAvailableResourceProfiles = resProfilesFactory
			return nil
		}
	}
	supportedResProfileTypes := profile.GetSupportedResourceProfileTypes()
	return fmt.Errorf("unknown resource profiles factory: %s Please set the RESOURCE_PROFILES environment variable to one of: %v", resProfilesType, supportedResProfileTypes)
}

func (fdr *FunctionDescriptionReconciler) readProfilingConfigValues() error {
	iterationsPerInputAndProfileStr := os.Getenv("ITERATIONS_PER_CONFIGURATION")
	if iterationsPerInputAndProfileStr == "" {
		return fmt.Errorf("please set the ITERATIONS_PER_CONFIGURATION environment variable to the number of profiling iterations that should be done for each resource profile and input size combination")
	}
	iterationsPerInputAndProfile, err := strconv.Atoi(iterationsPerInputAndProfileStr)
	if err != nil {
		return fmt.Errorf("the ITERATIONS_PER_CONFIGURATION environment variable is not a valid integer")
	}
	fdr.iterationsPerInputAndProfile = iterationsPerInputAndProfile

	concurrentProfileEvaluationsStr := os.Getenv("CONCURRENT_PROFILES")
	if concurrentProfileEvaluationsStr == "" {
		return fmt.Errorf("please set the CONCURRENT_PROFILES environment variable to the number of profiling iterations that should be done for each resource profile and input size combination")
	}
	concurrentProfileEvaluations, err := strconv.Atoi(concurrentProfileEvaluationsStr)
	if err != nil {
		return fmt.Errorf("the CONCURRENT_PROFILES environment variable is not a valid integer")
	}
	fdr.concurrentProfileEvaluations = concurrentProfileEvaluations

	return nil
}

func (fdr *FunctionDescriptionReconciler) getProfilingConfig(profilingNamespace string) *profiler.ProfilingConfig {
	timeout, err := time.ParseDuration("2m")
	if err != nil {
		panic("error parsing FunctionReadyTimeout duration")
	}

	config := &profiler.ProfilingConfig{
		CandidateProfiles:            fdr.getAvailableResourceProfiles(),
		IterationsPerInputAndProfile: fdr.iterationsPerInputAndProfile,
		ConcurrentProfiles:           fdr.concurrentProfileEvaluations,
		ProfilingNamespace:           profilingNamespace,
		FunctionReadyTimeout:         timeout,
	}
	return config
}
