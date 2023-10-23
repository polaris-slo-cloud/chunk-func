package profiler

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"github.com/go-logr/logr"
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
	knServing "knative.dev/serving/pkg/apis/serving/v1"
	knServingClient "knative.dev/serving/pkg/client/clientset/versioned/typed/serving/v1"

	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
	"polaris-slo-cloud.github.io/chunk-func/common/pkg/timing"
	"polaris-slo-cloud.github.io/chunk-func/profiler/pkg/trigger"
)

// Encapsulates the state of a profiling run.
type exhaustiveFunctionProfilerSession struct {
	// The original Knative Service of the serverless function being profiled.
	// For profiling copies of this service are created with different resource profiles.
	fn *function.FunctionWithDescription

	// The configuration for this profiling run.
	profilingConfig *ProfilingConfig

	// Used to access Knative Services in the cluster.
	servingClient knServingClient.ServingV1Interface

	// Stores the results, using resourceProfile.ID() as keys.
	// This map is protected by resultsMutex.
	results      map[string]*function.ResourceProfileResults
	resultsMutex sync.Mutex

	// Used to deploy and undeploy functions for profiling.
	deploymentMgr FunctionDeploymentManager

	logger *logr.Logger
}

func newExhaustiveFunctionProfilerSession(
	fn *function.FunctionWithDescription,
	profilingConfig *ProfilingConfig,
	servingClient knServingClient.ServingV1Interface,
	logger *logr.Logger,
) *exhaustiveFunctionProfilerSession {
	pr := &exhaustiveFunctionProfilerSession{
		fn:              fn,
		profilingConfig: profilingConfig,
		servingClient:   servingClient,
		results:         make(map[string]*function.ResourceProfileResults, len(profilingConfig.CandidateProfiles)),
		resultsMutex:    sync.Mutex{},
		deploymentMgr:   NewFunctionDeploymentManager(servingClient),
		logger:          logger,
	}
	return pr
}

// Executes the complete profiling session for all resource profiles and typical inputs.
// This operation commonly takes several minutes.
func (pr *exhaustiveFunctionProfilerSession) ExecuteProfilingSession(ctx context.Context) (*function.ProfilingSessionResults, error) {
	stopwatch := timing.NewStopwatch()
	stopwatch.Start()

	cancellableCtx, cancelFn := context.WithCancelCause(ctx)
	defer cancelFn(nil)

	candidateProfiles := setUpCandidateProfilesChan(pr.profilingConfig.CandidateProfiles)
	workersCount := pr.profilingConfig.ConcurrentProfiles
	wg := sync.WaitGroup{}
	wg.Add(workersCount)

	abortFn := func(resProfile *function.ResourceProfile, err error) {
		err = fmt.Errorf("profiling with %s resulted in an error: %v", resProfile.ID(), err)
		// If the context has already been cancelled, this does nothing.
		cancelFn(err)
	}

	for i := 0; i < workersCount; i++ {
		go func(id int) {
			pr.runProfilingWorker(cancellableCtx, id, candidateProfiles, abortFn)
			wg.Done()
		}(i)
	}

	wg.Wait()

	if err := cancellableCtx.Err(); err != nil {
		cause := context.Cause(cancellableCtx)
		return nil, cause
	}

	sessionResults := pr.aggregateAllResults()

	stopwatch.Stop()
	startTime := meta.NewTime(stopwatch.StartTime())
	sessionResults.ProfilingStarted = &startTime
	sessionResults.ProfilingDurationSeconds = int32(stopwatch.Duration().Seconds())
	return sessionResults, nil
}

// Receives ResourceProfiles to be evaluated from the profiles channel and profiles them.
// Results are added to the pr.results map.
func (pr *exhaustiveFunctionProfilerSession) runProfilingWorker(
	ctx context.Context,
	workerId int,
	profiles chan *function.ResourceProfile,
	abortOnErrorFn func(*function.ResourceProfile, error),
) {
	for resProfile := range profiles {
		results, err := pr.evaluateResourceProfile(ctx, resProfile)
		if err != nil {
			abortOnErrorFn(resProfile, err)
			return
		}

		profileId := resProfile.ID()
		pr.resultsMutex.Lock()
		pr.results[profileId] = results
		pr.resultsMutex.Unlock()
	}
}

// Executes the profiling for a single ResourceProfile.
// This consists of the following steps:
//  1. Deploy a function with the corresponding resource configuration.
//  2. Call it once to warm it up, i.e., ensure that the profiled invocations do not suffer from cold starts.
//  3. Iterate through all typical inputs and for each input perform N profiled function invocations.
//  4. Clean up the deployed function (also done in case of an error).
func (pr *exhaustiveFunctionProfilerSession) evaluateResourceProfile(ctx context.Context, resourceProfile *function.ResourceProfile) (*function.ResourceProfileResults, error) {
	results := &function.ResourceProfileResults{
		ResourceProfileId: resourceProfile.ID(),
	}

	targetFn, err := CreateAndWaitForService(ctx, pr.fn, pr.profilingConfig.ProfilingNamespace, resourceProfile, pr.deploymentMgr, pr.profilingConfig.FunctionReadyTimeout)
	if targetFn != nil {
		// We use a background context for deleting the function to ensure that it happens, even if the main context is cancelled.
		defer pr.deploymentMgr.DeleteFunction(context.Background(), targetFn)
	}
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			results.DeploymentStatus = function.DeploymentTimedOut
			return results, nil
		} else {
			return nil, err
		}
	}
	targetFnName := targetFn.Namespace + "." + targetFn.Name
	pr.logger.Info("Created new Knative Service", "service", targetFnName)

	var fnTrigger trigger.TimedFunctionTrigger[any] = trigger.NewRestTrigger()
	results.DeploymentStatus = function.DeploymentSuccess
	results.UnfilteredResults = make([]*function.ProfilingResult, len(pr.fn.Description.TypicalInputs))

	// Warm the function up.
	_, err = pr.profileFunctionCall(ctx, fnTrigger, targetFn, pr.fn.Description.TypicalInputs[0])
	if err != nil {
		return nil, err
	}
	pr.logger.Info("Successfully warmed Knative Service", "service", targetFnName)

	for i, input := range pr.fn.Description.TypicalInputs {
		pr.logger.Info("Executing iterations for input", "service", targetFnName, "inputSize", input.SizeBytes, "iterations", pr.profilingConfig.IterationsPerInputAndProfile)

		resultForInput, err := pr.profileWithInput(ctx, fnTrigger, targetFn, input)
		if err != nil {
			return nil, err
		}
		results.UnfilteredResults[i] = resultForInput

		pr.logger.Info("Successfully profiled input size", "service", targetFnName, "inputSize", input.SizeBytes)
	}

	pr.computeExecutionCosts(results, resourceProfile)
	sortProfilingResultsByInputSize(results.UnfilteredResults)
	results.Results = copyAndPruneResults(results.UnfilteredResults)

	return results, nil
}

// Loops through all typical inputs and performs N profiled function invocations using each input.
func (pr *exhaustiveFunctionProfilerSession) profileWithInput(
	ctx context.Context,
	fnTrigger trigger.TimedFunctionTrigger[any],
	targetFn *knServing.Service,
	input *function.FunctionInput,
) (*function.ProfilingResult, error) {
	iterations := pr.profilingConfig.IterationsPerInputAndProfile
	results := make([]*function.ProfilingResult, iterations)

	for i := 0; i < iterations; i++ {
		result, err := pr.profileFunctionCall(ctx, fnTrigger, targetFn, input)
		if err != nil {
			return nil, err
		}
		results[i] = result
	}

	return AggregateProfilingResults(results)
}

// Executes a single profiled function invocation.
func (pr *exhaustiveFunctionProfilerSession) profileFunctionCall(
	ctx context.Context,
	fnTrigger trigger.TimedFunctionTrigger[any],
	targetFn *knServing.Service,
	input *function.FunctionInput,
) (*function.ProfilingResult, error) {
	execResult, err := fnTrigger.TriggerFunction(ctx, targetFn, input)
	if err != nil {
		return nil, err
	}

	profResult := &function.ProfilingResult{
		StatusCode:      int32(execResult.StatusCode),
		InputSizeBytes:  input.SizeBytes,
		ExecutionTimeMs: execResult.ResponseTime.Milliseconds(),
	}
	return profResult, nil
}

func (pr *exhaustiveFunctionProfilerSession) aggregateAllResults() *function.ProfilingSessionResults {
	ret := &function.ProfilingSessionResults{
		Results: make([]*function.ResourceProfileResults, len(pr.profilingConfig.CandidateProfiles)),
	}

	for i, resProfile := range pr.profilingConfig.CandidateProfiles {
		// No locking needed anymore, because this is the only goroutine accessing the results.
		resProfileResults := pr.results[resProfile.ID()]
		ret.Results[i] = resProfileResults
	}

	return ret
}

func (pr *exhaustiveFunctionProfilerSession) computeExecutionCosts(results *function.ResourceProfileResults, profile *function.ResourceProfile) {
	for _, result := range results.UnfilteredResults {
		cost := profile.CalculateCost(result.ExecutionTimeMs)
		costStr := fmt.Sprintf("%10f", cost)
		result.ExecutionCost = &costStr
	}
}
