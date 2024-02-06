package profiler

import (
	"context"
	"fmt"
	"math"
	"sync"

	"github.com/go-logr/logr"
	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
	"polaris-slo-cloud.github.io/chunk-func/profiler/pkg/bayesianopt"
)

const (
	// This execution time will be stored in a BO model if the respective profiling attempt has failed.
	execTimeForFailure = math.MaxFloat64

	// If the BO returns a probability of improvement below this threshold, profiling for the respective input size is marked as complete.
	poiThreshold = 0.05
)

var (
	_ ProfilingStrategy = (*BayesianOptProfilingStrategy)(nil)

	profiledResultType = function.ProfilingResultProfiled
	inferredResultType = function.ProfilingResultInferred
)

// A ProfilingStrategy that uses Bayesian Optimization to reduce the number resource profiles
// that need to be evaluated.
type BayesianOptProfilingStrategy struct {
	// The available profiles that should be tried out.
	// These profiles are ordered by increasing memory size and base cost (per 100ms).
	availableProfiles []*function.ResourceProfile

	// Stores the resources profiles indexed by their memory size
	profilesByMem map[uint64]*function.ResourceProfile

	// Stores the inputs indexed by their size.
	fnInputs map[int64]*function.FunctionInput

	// Stores the function inputs, for which profiling has already completed.
	completedInputs      []*function.FunctionInput
	completedInputsMutex sync.Mutex

	// The channel that emits new ProfilingJobs to the profiling session.
	profilingQueue chan ProfilingJob

	// Stores the IDs of the BO models indexed by input size.
	// Each input size has its own Bayesian Optimizer.
	boModelIds      map[int64]string
	boModelIdsMutex sync.Mutex

	boClient bayesianopt.BayesianOptimizerServiceClient

	// This function needs to be called, if an unrecoverable error occurs.
	abortOnErrorFn context.CancelCauseFunc

	logger *logr.Logger
}

func NewBayesianOptProfilingStrategy(boClient bayesianopt.BayesianOptimizerServiceClient, logger *logr.Logger) *BayesianOptProfilingStrategy {
	return &BayesianOptProfilingStrategy{
		boClient:             boClient,
		completedInputsMutex: sync.Mutex{},
		boModelIdsMutex:      sync.Mutex{},
		logger:               logger,
	}
}

// Creates a buffered channel filled with all available profiles for distributing them to worker goroutines.
func (bops *BayesianOptProfilingStrategy) SetUpProfilingQueue(
	ctx context.Context,
	fn *function.FunctionWithDescription,
	availableProfiles []*function.ResourceProfile,
	abortOnErrorFn context.CancelCauseFunc,
) (chan ProfilingJob, error) {
	bops.abortOnErrorFn = abortOnErrorFn
	bops.availableProfiles = availableProfiles
	bops.fnInputs = bops.createInputsMap(fn.Description.TypicalInputs)
	bops.completedInputs = make([]*function.FunctionInput, 0, len(fn.Description.TypicalInputs))
	bops.profilingQueue = make(chan ProfilingJob, len(fn.Description.TypicalInputs))

	if err := bops.setUpBoModels(ctx); err != nil {
		return nil, err
	}

	go bops.runQueueingLoop(ctx)
	return bops.profilingQueue, nil
}

func (bops *BayesianOptProfilingStrategy) AggregateAllResults(ctx context.Context, resultsMap map[string]*function.ResourceProfileResults) (*function.ProfilingSessionResults, error) {
	ret := &function.ProfilingSessionResults{
		Results: make([]*function.ResourceProfileResults, len(bops.availableProfiles)),
	}

	for i, resProfile := range bops.availableProfiles {
		resProfileResults, err := bops.assembleResultsForProfile(ctx, resProfile, resultsMap)
		if err != nil {
			return nil, err
		}
		ret.Results[i] = resProfileResults
	}

	return ret, nil
}

func (bops *BayesianOptProfilingStrategy) Cleanup() {
	bops.boModelIdsMutex.Lock()
	defer bops.boModelIdsMutex.Unlock()

	if bops.boModelIds == nil {
		return
	}

	for inputSize, modelId := range bops.boModelIds {
		boModelId := &bayesianopt.BoModelId{
			ModelId: modelId,
		}
		if _, err := bops.boClient.DeleteBoModel(context.Background(), boModelId); err == nil {
			bops.logger.Info("Successfully deleted BO model", "inputSize", inputSize, "boModelId", modelId)
		} else {
			// Even if there is an error, we continue the loop, because we want to do a best effort in cleaning up all models.
			bops.logger.Error(err, "Error deleting BO model", "inputSize", inputSize, "boModelId", modelId)
		}
	}

	bops.boModelIds = nil
}

func (bops *BayesianOptProfilingStrategy) createInputsMap(fnInputs []*function.FunctionInput) map[int64]*function.FunctionInput {
	inputsMap := make(map[int64]*function.FunctionInput, len(fnInputs))
	for _, input := range fnInputs {
		inputsMap[input.SizeBytes] = input
	}
	return inputsMap
}

func (bops *BayesianOptProfilingStrategy) setUpProfilesList(availableProfiles []*function.ResourceProfile) []uint64 {
	bops.profilesByMem = make(map[uint64]*function.ResourceProfile, len(availableProfiles))
	memorySizes := make([]uint64, len(availableProfiles))

	for i, resProfile := range availableProfiles {
		memSize := uint64(resProfile.MemoryMiB)
		memorySizes[i] = memSize
		bops.profilesByMem[memSize] = resProfile
	}

	return memorySizes
}

func (bops *BayesianOptProfilingStrategy) setUpBoModels(ctx context.Context) error {
	bops.boModelIds = make(map[int64]string, len(bops.fnInputs))
	profilesList := bops.setUpProfilesList(bops.availableProfiles)

	for inputSize := range bops.fnInputs {
		initData := &bayesianopt.BoModelInitData{
			PossibleXValues: profilesList,
		}
		boModelId, err := bops.boClient.CreateBoModel(ctx, initData)
		if err != nil {
			return err
		}
		if boModelId.ModelId == "" {
			return fmt.Errorf("CreateBoModel returned an empty modelId")
		}
		bops.boModelIds[inputSize] = boModelId.ModelId
		bops.logger.Info("Successfully created BO model", "inputSize", inputSize, "boModelId", boModelId.ModelId)
	}

	return nil
}

func (bops *BayesianOptProfilingStrategy) getBoModelId(inputSize int64) *string {
	bops.boModelIdsMutex.Lock()
	defer bops.boModelIdsMutex.Unlock()

	if bops.boModelIds != nil {
		modelId := bops.boModelIds[inputSize]
		return &modelId
	}
	return nil
}

func (bops *BayesianOptProfilingStrategy) runQueueingLoop(ctx context.Context) {
	for _, input := range bops.fnInputs {
		go bops.getAndQueueNextProfile(ctx, input, nil, nil)
	}
}

// Gets the next ResourceProfile to be evaluated for the specified input form the BO and queues it.
// The lastProfileEvaluated and lastProfileExecTimeMs may be nil, if this is the first call for this input.
// If the probability of improvement is below the threshold, the this input size is marked as complete.
func (bops *BayesianOptProfilingStrategy) getAndQueueNextProfile(
	ctx context.Context,
	input *function.FunctionInput,
	lastProfileEvaluated *function.ResourceProfile,
	lastProfileExecTimeMs *float64,
) {
	boModelId := bops.getBoModelId(input.SizeBytes)
	if boModelId == nil {
		// Apparently Cleanup() has already been called due to an error during profiling.
		return
	}

	req := &bayesianopt.GetBoSuggestionRequest{
		ModelId: *boModelId,
	}
	if lastProfileEvaluated != nil {
		req.Observation = &bayesianopt.BoObservation{
			X:           uint64(lastProfileEvaluated.MemoryMiB),
			Observation: *lastProfileExecTimeMs,
		}
	}

	suggestion, err := bops.boClient.GetBoSuggestion(ctx, req)
	if err != nil {
		bops.abortOnErrorFn(fmt.Errorf("GetBoSuggestion error %v", err))
	}

	if suggestion.Suggestion.Poi < poiThreshold {
		bops.markInputAsComplete(input)
		return
	}

	if nextProfile, ok := bops.profilesByMem[suggestion.Suggestion.X]; ok {
		bops.profilingQueue <- bops.createNewProfilingJob(input, nextProfile)
	} else {
		bops.abortOnErrorFn(fmt.Errorf("GetBoSuggestion returned unknown memory size %v", suggestion.Suggestion.X))
	}
}

func (bops *BayesianOptProfilingStrategy) createNewProfilingJob(input *function.FunctionInput, resProfile *function.ResourceProfile) ProfilingJob {
	return NewObservableProfilingJob(
		resProfile,
		[]*function.FunctionInput{input},
		bops.onProfilingDone,
		bops.onProfilingError,
	)
}

func (bops *BayesianOptProfilingStrategy) onProfilingDone(ctx context.Context, job ProfilingJob, results *function.ResourceProfileResults) {
	input := job.Inputs()[0]
	if len(results.UnfilteredResults) > 1 {
		bops.abortOnErrorFn(
			fmt.Errorf(
				"profiling %s with input %v returned more than one result, len(UnfilteredResults)=%v",
				job.ResourceProfile().ID(),
				input.SizeBytes,
				len(results.UnfilteredResults),
			),
		)
	}

	var execTimeMs float64
	if len(results.Results) == 1 {
		execTimeMs = float64(results.Results[0].ExecutionTimeMs)
	} else {
		execTimeMs = execTimeForFailure
	}
	bops.getAndQueueNextProfile(ctx, input, job.ResourceProfile(), &execTimeMs)
}

func (bops *BayesianOptProfilingStrategy) onProfilingError(job ProfilingJob, err error) {
	bops.abortOnErrorFn(err)
}

// Marks the specified input as complete.
// Once all inputs are marked as complete, the profilingQueue is closed.
func (bops *BayesianOptProfilingStrategy) markInputAsComplete(input *function.FunctionInput) {
	bops.completedInputsMutex.Lock()
	defer bops.completedInputsMutex.Unlock()

	bops.completedInputs = append(bops.completedInputs, input)
	if len(bops.completedInputs) == len(bops.fnInputs) {
		close(bops.profilingQueue)
	}
}

func (bops *BayesianOptProfilingStrategy) assembleResultsForProfile(
	ctx context.Context,
	resProfile *function.ResourceProfile,
	resultsMap map[string]*function.ResourceProfileResults,
) (*function.ResourceProfileResults, error) {
	var unfilteredProfilingResults []*function.ProfilingResult
	if profilingResults, ok := resultsMap[resProfile.ID()]; ok {
		if profilingResults.DeploymentStatus != function.DeploymentSuccess {
			return profilingResults, nil
		}
		unfilteredProfilingResults = profilingResults.UnfilteredResults
	}

	ret := &function.ResourceProfileResults{
		ResourceProfileId: resProfile.ID(),
		DeploymentStatus:  function.DeploymentSuccess,
		UnfilteredResults: make([]*function.ProfilingResult, len(bops.fnInputs)),
	}

	// Input size of the current index in unfilteredProfilingResults.
	// This is -1 if there are no more items in that slice.
	currProfiledIndex, currProfiledInputSize := getNextProfiledInputSize(unfilteredProfilingResults, -1)

	for i, fnInput := range bops.fnInputs {
		if fnInput.SizeBytes == currProfiledInputSize {
			result := unfilteredProfilingResults[currProfiledIndex]
			result.ResultType = &profiledResultType
			ret.UnfilteredResults[i] = result
			currProfiledIndex, currProfiledInputSize = getNextProfiledInputSize(unfilteredProfilingResults, currProfiledIndex)
		} else {
			inferredResult, err := bops.getInferredResult(ctx, fnInput, resProfile)
			if err != nil {
				return nil, err
			}
			ret.UnfilteredResults[i] = inferredResult
		}
	}

	computeExecutionCosts(ret, resProfile)
	ret.Results = copyAndPruneResults(ret.UnfilteredResults)
	return ret, nil
}

func (bops *BayesianOptProfilingStrategy) getInferredResult(ctx context.Context, input *function.FunctionInput, resProfile *function.ResourceProfile) (*function.ProfilingResult, error) {
	boModelId := bops.getBoModelId(input.SizeBytes)
	if boModelId == nil {
		return nil, fmt.Errorf("cannot call BO service, because model IDs have already been cleaned up")
	}

	req := &bayesianopt.InferYRequest{
		ModelId: *boModelId,
		X:       uint64(input.SizeBytes),
	}

	result, err := bops.boClient.InferY(ctx, req)
	if err != nil {
		return nil, err
	}

	ret := &function.ProfilingResult{
		StatusCode:      200,
		ResultType:      &inferredResultType,
		InputSizeBytes:  input.SizeBytes,
		ExecutionTimeMs: int64(math.Round(result.Y)),
	}
	return ret, nil
}

// Returns the index and the input size of the next unfilteredProfilingResult, based on the current index.
// If unfilteredProfilingResults is nil or currIndex++ exceeds its length, the returned input size will be -1.
func getNextProfiledInputSize(unfilteredProfilingResults []*function.ProfilingResult, currIndex int) (int, int64) {
	currIndex++
	if unfilteredProfilingResults == nil || currIndex == len(unfilteredProfilingResults) {
		return currIndex, -1
	}

	input := unfilteredProfilingResults[currIndex]
	return currIndex, input.InputSizeBytes
}
