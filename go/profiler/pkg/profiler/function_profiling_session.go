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

// Encapsulates the state and generic logic of a profiling session.
// The deployment of function instances with specific resource profiles and their profiling is
// handled by this type. The selection of the resource profiles to be evaluated and the final
// aggregation or interpolation of the results is handled by the ProfilingStrategy.
type FunctionProfilingSession struct {
	// The original Knative Service of the serverless function being profiled.
	// For profiling copies of this service are created with different resource profiles.
	fn *function.FunctionWithDescription

	// The configuration for this profiling run.
	profilingConfig *ProfilingConfig

	// The strategy used for determining the candidate profiles and for aggregation of the final results.
	profilingStrategy ProfilingStrategy

	// Used to access Knative Services in the cluster.
	servingClient knServingClient.ServingV1Interface

	// Stores the results, using resourceProfile.ID() as keys.
	// This map is protected by resultsMutex.
	results      map[string]*function.ResourceProfileResults
	resultsMutex sync.Mutex

	// Used to deploy and undeploy functions for profiling.
	deploymentMgr FunctionDeploymentManager

	// Used to create the triggers for triggering a deployed function with and timing the call.
	fnTriggerFactoryFn trigger.TimedFunctionTriggerFactoryFn[any]

	logger *logr.Logger
}

func NewFunctionProfilingSession(
	fn *function.FunctionWithDescription,
	profilingConfig *ProfilingConfig,
	profilingStrategy ProfilingStrategy,
	fnTriggerFactoryFn trigger.TimedFunctionTriggerFactoryFn[any],
	servingClient knServingClient.ServingV1Interface,
	logger *logr.Logger,
) *FunctionProfilingSession {
	fps := &FunctionProfilingSession{
		fn:                 fn,
		profilingConfig:    profilingConfig,
		profilingStrategy:  profilingStrategy,
		servingClient:      servingClient,
		results:            make(map[string]*function.ResourceProfileResults, len(profilingConfig.CandidateProfiles)),
		resultsMutex:       sync.Mutex{},
		deploymentMgr:      NewFunctionDeploymentManager(servingClient),
		fnTriggerFactoryFn: fnTriggerFactoryFn,
		logger:             logger,
	}
	return fps
}

// Executes the complete profiling session for all resource profiles and typical inputs.
// This operation commonly takes several minutes.
// At the end of the session, the ProfilingStrategy.Cleanup() method is called.
func (fps *FunctionProfilingSession) ExecuteProfilingSession(ctx context.Context) (*function.ProfilingSessionResults, error) {
	stopwatch := timing.NewStopwatch()
	stopwatch.Start()

	cancellableCtx, cancelFn := context.WithCancelCause(ctx)
	defer cancelFn(nil)
	defer fps.profilingStrategy.Cleanup()

	profilingQueue, err := fps.profilingStrategy.SetUpProfilingQueue(cancellableCtx, fps.fn, fps.profilingConfig.CandidateProfiles, cancelFn)
	if err != nil {
		return nil, err
	}

	workersCount := fps.profilingConfig.ConcurrentProfiles
	wg := sync.WaitGroup{}
	wg.Add(workersCount)

	abortFn := func(resProfile *function.ResourceProfile, err error) {
		err = fmt.Errorf("profiling with %s resulted in an error: %v", resProfile.ID(), err)
		// If the context has already been cancelled, this does nothing.
		cancelFn(err)
	}

	for i := 0; i < workersCount; i++ {
		go func(id int) {
			fps.runProfilingWorker(cancellableCtx, id, profilingQueue, abortFn)
			wg.Done()
		}(i)
	}

	wg.Wait()

	if err := cancellableCtx.Err(); err != nil {
		cause := context.Cause(cancellableCtx)
		return nil, cause
	}

	// No locking needed anymore, because this is the only goroutine accessing the results.
	sessionResults, err := fps.profilingStrategy.AggregateAllResults(cancellableCtx, fps.results)
	if err != nil {
		return nil, err
	}

	stopwatch.Stop()
	startTime := meta.NewTime(stopwatch.StartTime())
	sessionResults.ProfilingStarted = &startTime
	sessionResults.ProfilingDurationSeconds = int32(stopwatch.Duration().Seconds())
	return sessionResults, nil
}

// Receives ResourceProfiles to be evaluated from the profiles channel and profiles them.
// Results are added to the pr.results map.
func (fps *FunctionProfilingSession) runProfilingWorker(
	ctx context.Context,
	workerId int,
	queue chan ProfilingJob,
	abortOnErrorFn func(*function.ResourceProfile, error),
) {
	for job := range queue {
		resProfile := job.ResourceProfile()
		results, err := fps.evaluateResourceProfileWithInputs(ctx, resProfile, job.Inputs())
		if err != nil {
			abortOnErrorFn(resProfile, err)
			job.ProfilingError(err)
			return
		}

		fps.storeResults(resProfile, results)
		job.ProfilingDone(ctx, results)
	}
}

func (fps *FunctionProfilingSession) storeResults(resProfile *function.ResourceProfile, results *function.ResourceProfileResults) {
	profileId := resProfile.ID()
	fps.resultsMutex.Lock()
	defer fps.resultsMutex.Unlock()

	if existingResults, ok := fps.results[profileId]; ok {
		results = mergeResults(existingResults, results)
	}
	fps.results[profileId] = results
}

// Executes the profiling for a single ResourceProfile with the specified inputs.
// This consists of the following steps:
//  1. Deploy a function with the corresponding resource configuration.
//  2. Call it once to warm it up, i.e., ensure that the profiled invocations do not suffer from cold starts.
//  3. Iterate through all specified inputs and for each input perform N profiled function invocations.
//  4. Clean up the deployed function (also done in case of an error).
func (fps *FunctionProfilingSession) evaluateResourceProfileWithInputs(
	ctx context.Context,
	resourceProfile *function.ResourceProfile,
	inputs []*function.FunctionInput,
) (*function.ResourceProfileResults, error) {
	results := &function.ResourceProfileResults{
		ResourceProfileId: resourceProfile.ID(),
	}

	targetFn, err := CreateAndWaitForService(ctx, fps.fn, fps.profilingConfig.ProfilingNamespace, resourceProfile, fps.deploymentMgr, fps.profilingConfig.FunctionReadyTimeout)
	if targetFn != nil {
		// We use a background context for deleting the function to ensure that it happens, even if the main context is cancelled.
		defer fps.deploymentMgr.DeleteFunction(context.Background(), targetFn)
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
	fps.logger.Info("Created new Knative Service", "service", targetFnName)

	fnTrigger := fps.fnTriggerFactoryFn()
	results.DeploymentStatus = function.DeploymentSuccess
	results.UnfilteredResults = make([]*function.ProfilingResult, len(inputs))

	// Warm the function up.
	_, err = fps.profileFunctionCall(ctx, fnTrigger, targetFn, inputs[0])
	if err != nil {
		return nil, err
	}
	fps.logger.Info("Successfully warmed Knative Service", "service", targetFnName)

	for i, input := range inputs {
		fps.logger.Info("Executing iterations for input", "service", targetFnName, "inputSize", input.SizeBytes, "iterations", fps.profilingConfig.IterationsPerInputAndProfile)

		resultForInput, err := fps.profileWithInput(ctx, fnTrigger, targetFn, input)
		if err != nil {
			return nil, err
		}
		results.UnfilteredResults[i] = resultForInput

		fps.logger.Info("Successfully profiled input size", "service", targetFnName, "inputSize", input.SizeBytes)
	}

	computeExecutionCosts(results, resourceProfile)
	sortProfilingResultsByInputSize(results.UnfilteredResults)
	results.Results = copyAndPruneResults(results.UnfilteredResults)

	return results, nil
}

// Loops through all typical inputs and performs N profiled function invocations using each input.
func (fps *FunctionProfilingSession) profileWithInput(
	ctx context.Context,
	fnTrigger trigger.TimedFunctionTrigger[any],
	targetFn *knServing.Service,
	input *function.FunctionInput,
) (*function.ProfilingResult, error) {
	iterations := fps.profilingConfig.IterationsPerInputAndProfile
	results := make([]*function.ProfilingResult, iterations)

	for i := 0; i < iterations; i++ {
		result, err := fps.profileFunctionCall(ctx, fnTrigger, targetFn, input)
		if err != nil {
			return nil, err
		}
		results[i] = result
	}

	return AggregateProfilingResults(results)
}

// Executes a single profiled function invocation.
func (fps *FunctionProfilingSession) profileFunctionCall(
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
