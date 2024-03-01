package profiler

import (
	"context"
	"fmt"
	"math"
	"slices"
	"sync"
	"time"

	"github.com/go-logr/logr"
	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
	"polaris-slo-cloud.github.io/chunk-func/profiler/pkg/bayesianopt"
)

var (
	// If the BO returns a probability of improvement below this threshold, profiling for the respective input size is marked as complete.
	DefaultBoPoiThreshold = 0.02

	// We use default values for the hyperparameters for the acquisition functions of BO.
	// For EI and POI only xi is relevant, defaultKappa would be relevant for UCB.
	defaultBoKappa = 2.576
	DefaultBoXi    = 0.01

	DefaultBoMaxSamplesPercent = 0.4
)

var (
	_ ProfilingStrategy = (*BayesianOptProfilingStrategy)(nil)

	// This execution time will be stored for an unfiltered inferred result, if the corresponding resource profile has been pruned.
	execDurationForPrunedProfile, _ = time.ParseDuration("1h")

	profiledResultType = function.ProfilingResultProfiled
	inferredResultType = function.ProfilingResultInferred
)

// A ProfilingStrategy that uses Bayesian Optimization to reduce the number resource profiles
// that need to be evaluated.
type BayesianOptProfilingStrategy struct {
	// The available profiles on the underlying platform.
	// These profiles are ordered by increasing memory size and base cost (per 100ms).
	availableProfiles []*function.ResourceProfile

	// Stores the resources profiles indexed by their memory size
	profilesByMem map[uint64]*function.ResourceProfile

	// List of all the memory sizes of all ResourceProfiles in availableProfiles.
	// This is the base list of all possible X values for the BO.
	profileMemorySizes []uint64

	// Stores the minimum resource profile for each input size.
	// Initially, this is the lowest of the availableProfiles for all input sizes,
	// but if the ResourceProfile domain is shrunk
	// due to pruning timed out profiles, this changes to a higher profile.
	// Keys: input size, Values: minResourceProfile
	minResourceProfileByInput map[int64]*function.ResourceProfile

	// RW lock for minResourceProfileMemoryByInput.
	// Locking protocol: no other lock must be held when acquiring this lock.
	minResourceProfileByInputLock sync.RWMutex

	// The function that we are profiling.
	fn *function.FunctionWithDescription

	// Stores the function inputs, for which profiling has already completed.
	completedInputs      []*function.FunctionInput
	completedInputsMutex sync.Mutex

	// The channel that emits new ProfilingJobs to the profiling session.
	profilingQueue       chan ProfilingJob
	profilingQueueClosed bool

	// We need a mutex, because we need to be able to check if the profilingQueue has been closed due to an error.
	// Locking protocol: no other lock must be held when acquiring this mutex.
	profilingQueueMutex sync.Mutex

	// The maximum number of samples that will be collected, as a percentage of the total number of profiles.
	maxSamplesPercent float64

	// The xi hyperparameter for BO.
	xi float64

	// If the BO returns a probability of improvement below this threshold, profiling for the respective input size is marked as complete.
	poiThreshold float64

	// Stores the IDs of the BO models indexed by input size.
	// Each input size has its own Bayesian Optimizer.
	boModelIds map[int64]string

	// Mutex for boModelIds
	// Locking protocol: no other lock must be held when acquiring this mutex.
	boModelIdsMutex sync.Mutex

	boClient bayesianopt.BayesianOptimizerServiceClient

	// This function needs to be called, if an unrecoverable error occurs.
	abortOnErrorFn context.CancelCauseFunc

	logger *logr.Logger
}

func NewBayesianOptProfilingStrategy(
	boClient bayesianopt.BayesianOptimizerServiceClient,
	maxSamplesPercent float64,
	xi float64,
	poiThreshold float64,
	logger *logr.Logger,
) *BayesianOptProfilingStrategy {
	return &BayesianOptProfilingStrategy{
		boClient:                      boClient,
		minResourceProfileByInputLock: sync.RWMutex{},
		completedInputsMutex:          sync.Mutex{},
		boModelIdsMutex:               sync.Mutex{},
		profilingQueueMutex:           sync.Mutex{},
		maxSamplesPercent:             maxSamplesPercent,
		xi:                            xi,
		poiThreshold:                  poiThreshold,
		logger:                        logger,
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
	bops.fn = fn
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
	countProfiledAndInferredConfigurations(ret)

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

func (bops *BayesianOptProfilingStrategy) setUpProfilesList(availableProfiles []*function.ResourceProfile) []uint64 {
	bops.profilesByMem = make(map[uint64]*function.ResourceProfile, len(availableProfiles))
	bops.minResourceProfileByInput = make(map[int64]*function.ResourceProfile, len(bops.fn.Description.TypicalInputs))
	bops.profileMemorySizes = make([]uint64, len(availableProfiles))

	for i, resProfile := range availableProfiles {
		memSize := uint64(resProfile.MemoryMiB)
		bops.profileMemorySizes[i] = memSize
		bops.profilesByMem[memSize] = resProfile
	}

	minProfile := availableProfiles[0]
	for _, input := range bops.fn.Description.TypicalInputs {
		bops.minResourceProfileByInput[input.SizeBytes] = minProfile
	}

	return bops.profileMemorySizes
}

func (bops *BayesianOptProfilingStrategy) setUpBoModels(ctx context.Context) error {
	bops.boModelIds = make(map[int64]string, len(bops.fn.Description.TypicalInputs))
	profilesList := bops.setUpProfilesList(bops.availableProfiles)

	for _, input := range bops.fn.Description.TypicalInputs {
		initData := &bayesianopt.BoModelInitData{
			PossibleXValues:   profilesList,
			Kappa:             &defaultBoKappa,
			Xi:                &bops.xi,
			MaxSamplesPercent: bops.maxSamplesPercent,
		}
		boModelId, err := bops.boClient.CreateBoModel(ctx, initData)
		if err != nil {
			return err
		}
		if boModelId.ModelId == "" {
			return fmt.Errorf("CreateBoModel returned an empty modelId")
		}
		bops.boModelIds[input.SizeBytes] = boModelId.ModelId
		bops.logger.Info("Successfully created BO model", "inputSize", input.SizeBytes, "boModelId", boModelId.ModelId)
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
	for _, input := range bops.fn.Description.TypicalInputs {
		go bops.getAndQueueNextProfile(ctx, input, nil, nil)
	}
}

// Gets the next ResourceProfile to be evaluated for the specified input form the BO and queues it.
// The lastProfileEvaluated and lastProfileExecTimeMs may be nil, if this is the first call for this input
// or if the ResourceProfile domain for this input has been shrunk.
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

	suggestion, err := bops.getBoSuggestion(ctx, *boModelId, input, lastProfileEvaluated, lastProfileExecTimeMs)
	if err != nil {
		bops.signalError(fmt.Errorf("GetBoSuggestion error %v", err))
		return
	}

	if suggestion.Suggestion.Poi < bops.poiThreshold {
		bops.markInputAsComplete(input)
		return
	}

	if nextProfile, ok := bops.profilesByMem[suggestion.Suggestion.X]; ok {
		nextJob := bops.createNewProfilingJob(input, nextProfile)
		bops.queueJob(nextJob)
	} else {
		bops.signalError(fmt.Errorf("GetBoSuggestion returned unknown memory size %v", suggestion.Suggestion.X))
	}
}

func (bops *BayesianOptProfilingStrategy) getBoSuggestion(
	ctx context.Context,
	boModelId string,
	input *function.FunctionInput,
	lastProfileEvaluated *function.ResourceProfile,
	lastProfileExecTimeMs *float64,
) (*bayesianopt.GetBoSuggestionResponse, error) {
	req := &bayesianopt.GetBoSuggestionRequest{
		ModelId: boModelId,
	}

	if lastProfileEvaluated != nil {
		// Before reporting the latest observation, we check if it is still within the ResourceProfile domain of that input size
		// just in case another job's timeout has caused the input size's ResourceProfile to shrink.
		// The Unlock() is executed when this method returns (defer is bound to the func, not the block), which is correct,
		// because we want to protect the call to the BO server as well.
		// If there is no lastProfileEvaluated, we don't need the lock.
		//
		// Instead using the RW lock, another option would be to send meaningful error codes from
		// the BO server and to retry GetBoSuggestion, if the observation is out of scope.
		bops.minResourceProfileByInputLock.RLock()
		defer bops.minResourceProfileByInputLock.RUnlock()

		minResourceProfile := bops.minResourceProfileByInput[input.SizeBytes]
		if lastProfileEvaluated.MemoryMiB >= minResourceProfile.MemoryMiB {
			req.Observation = &bayesianopt.BoObservation{
				X:           uint64(lastProfileEvaluated.MemoryMiB),
				Observation: *lastProfileExecTimeMs,
			}
		}
	}

	return bops.boClient.GetBoSuggestion(ctx, req)
}

func (bops *BayesianOptProfilingStrategy) createNewProfilingJob(input *function.FunctionInput, resProfile *function.ResourceProfile) ProfilingJob {
	return NewObservableProfilingJob(
		resProfile,
		[]*function.FunctionInput{input},
		bops.onProfilingDone,
		bops.onProfilingError,
	)
}

func (bops *BayesianOptProfilingStrategy) queueJob(job ProfilingJob) {
	bops.profilingQueueMutex.Lock()
	defer bops.profilingQueueMutex.Unlock()

	// If the queue channel has already been closed, there has been an error, which was already signalled.
	if !bops.profilingQueueClosed {
		bops.profilingQueue <- job
	}
}

func (bops *BayesianOptProfilingStrategy) onProfilingDone(ctx context.Context, job ProfilingJob, results *function.ResourceProfileResults) {
	input := job.Inputs()[0]
	if len(results.UnfilteredResults) > 1 {
		bops.signalError(
			fmt.Errorf(
				"profiling %s with input %v returned more than one result, len(UnfilteredResults)=%v",
				job.ResourceProfile().ID(),
				input.SizeBytes,
				len(results.UnfilteredResults),
			),
		)
	}

	if len(results.Results) == 1 && function.IsSuccessStatusCode(results.Results[0].StatusCode) {
		execTimeMs := float64(results.Results[0].ExecutionTimeMs)
		bops.getAndQueueNextProfile(ctx, input, job.ResourceProfile(), &execTimeMs)
	} else {
		// Since the current resource profile failed to process the input, we assume that
		// all weaker profiles would fail too. So, we prune them for this input size.
		// This is necessary, because exec times or timeouts from failed executions confuse the BO
		// and may cause it to get stuck in a certain region.
		shrinkRes, err := bops.shrinkResourceProfileDomain(ctx, job.ResourceProfile(), input)
		if err != nil {
			bops.signalError(err)
		}
		if shrinkRes != nil {
			if shrinkRes.RemainingXValuesCount > 0 {
				bops.getAndQueueNextProfile(ctx, input, nil, nil)
			} else {
				bops.markInputAsComplete(input)
			}
		}
	}
}

func (bops *BayesianOptProfilingStrategy) onProfilingError(job ProfilingJob, err error) {
	bops.signalError(err)
}

func (bops *BayesianOptProfilingStrategy) signalError(err error) {
	bops.abortOnErrorFn(err)
	bops.closeProfilingQueue()
}

// Marks the specified input as complete.
// Once all inputs are marked as complete, the profilingQueue is closed.
func (bops *BayesianOptProfilingStrategy) markInputAsComplete(input *function.FunctionInput) {
	bops.completedInputsMutex.Lock()
	defer bops.completedInputsMutex.Unlock()

	bops.completedInputs = append(bops.completedInputs, input)
	if len(bops.completedInputs) == len(bops.fn.Description.TypicalInputs) {
		bops.closeProfilingQueue()
	}
}

// Returns the ShrinkInputDomainResponse or an error.
// If Cleanup() has already been called or the ResourceProfile domain has already been shrunk,
// both return values are nil.
func (bops *BayesianOptProfilingStrategy) shrinkResourceProfileDomain(
	ctx context.Context,
	failedResProfile *function.ResourceProfile,
	input *function.FunctionInput,
) (*bayesianopt.ShrinkInputDomainResponse, error) {
	boModelId := bops.getBoModelId(input.SizeBytes)
	if boModelId == nil {
		// Apparently Cleanup() has already been called due to an error during profiling.
		return nil, nil
	}

	bops.minResourceProfileByInputLock.Lock()
	defer bops.minResourceProfileByInputLock.Unlock()

	// If another goroutine has already shrunk the ResourceProfile domain further than we would, we ignore this request.
	prevMinResProfile := bops.minResourceProfileByInput[input.SizeBytes]
	if failedResProfile.MemoryMiB < prevMinResProfile.MemoryMiB {
		return nil, nil
	}

	prunedMemSizes, newMinResProfile := bops.getPrunedMemorySizesAndProfile(failedResProfile)
	req := &bayesianopt.ShrinkInputDomainRequest{
		ModelId:         *boModelId,
		PossibleXValues: prunedMemSizes,
	}

	res, err := bops.boClient.ShrinkInputDomain(ctx, req)
	if err != nil {
		return nil, err
	}

	bops.minResourceProfileByInput[input.SizeBytes] = newMinResProfile
	return res, nil
}

func (bops *BayesianOptProfilingStrategy) getPrunedMemorySizesAndProfile(failedResProfile *function.ResourceProfile) (prunedList []uint64, newMinResProfile *function.ResourceProfile) {
	index, found := slices.BinarySearch(bops.profileMemorySizes, uint64(failedResProfile.MemoryMiB))
	if !found {
		panic(fmt.Sprintf("Unknown resource profile %s", failedResProfile.ID()))
	}
	if index < len(bops.profileMemorySizes)-1 {
		newMinProfileIndex := index + 1
		newMinResProfile = bops.availableProfiles[newMinProfileIndex]
		prunedList = bops.profileMemorySizes[newMinProfileIndex:len(bops.profileMemorySizes)]
	} else {
		panic(fmt.Sprintf("ToDo: handle situation where no resourceProfile is able to handle the function. Failed profile: %s", failedResProfile.ID()))
	}
	return prunedList, newMinResProfile
}

func (bops *BayesianOptProfilingStrategy) closeProfilingQueue() {
	bops.profilingQueueMutex.Lock()
	defer bops.profilingQueueMutex.Unlock()
	if !bops.profilingQueueClosed {
		close(bops.profilingQueue)
		bops.profilingQueueClosed = true
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
		UnfilteredResults: make([]*function.ProfilingResult, len(bops.fn.Description.TypicalInputs)),
	}

	// Input size of the current index in unfilteredProfilingResults.
	// This is -1 if there are no more items in that slice.
	currProfiledIndex, currProfiledInputSize := getNextProfiledInputSize(unfilteredProfilingResults, -1)

	for i, fnInput := range bops.fn.Description.TypicalInputs {
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
	ret := &function.ProfilingResult{
		StatusCode:     200,
		ResultType:     &inferredResultType,
		InputSizeBytes: input.SizeBytes,
	}

	// At this point, we no longer need to lock the map.
	minResProfileForInput := bops.minResourceProfileByInput[input.SizeBytes]
	if resProfile.MemoryMiB < minResProfileForInput.MemoryMiB {
		ret.StatusCode = 504 // Gateway timeout
		ret.ExecutionTimeMs = int64(execDurationForPrunedProfile.Milliseconds())
		return ret, nil
	}

	boModelId := bops.getBoModelId(input.SizeBytes)
	if boModelId == nil {
		return nil, fmt.Errorf("cannot call BO service, because model IDs have already been cleaned up")
	}

	req := &bayesianopt.InferYRequest{
		ModelId: *boModelId,
		X:       uint64(resProfile.MemoryMiB),
	}

	result, err := bops.boClient.InferY(ctx, req)
	if err != nil {
		return nil, err
	}
	ret.ExecutionTimeMs = int64(math.Round(result.Y))

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
