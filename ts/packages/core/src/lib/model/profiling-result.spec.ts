import { FunctionDeploymentStatus, ProfilingResult, ProfilingResultType, ProfilingSessionResults, ResourceProfileResults, findResultForInput, getResultsForInput } from './profiling-result';

describe('ProfilingResult utils', () => {

    function createProfilingResult(inputSizeBytes: number, statusCode: number = 200, executionTimeMs: number = 1000): ProfilingResult {
        return {
            statusCode,
            inputSizeBytes,
            executionTimeMs,
            executionCost: 0.1,
            resultType: ProfilingResultType.ProfilingResultProfiled,
        };
    }

    function createProfilingResults(inputSizes: number[]): ProfilingResult[] {
        return inputSizes.map(inputSize => createProfilingResult(inputSize, 200, inputSize * 10));
    }

    function createResourceProfileResults(resourceProfileId: string, inputSizes: number[]): ResourceProfileResults {
        const profilingResults = createProfilingResults(inputSizes);
        return {
            deploymentStatus: FunctionDeploymentStatus.DeploymentSuccess,
            resourceProfileId,
            results: profilingResults,
        }
    }

    function createRawProfilingSessionResults(profiledInputSizes: number[]): ProfilingSessionResults {
        return {
            profilingStarted: '',
            profilingDurationSeconds: 1000,
            iterationsPerInputAndProfile: 5,
            profiledInputSizes,
            results: [],
        }
    }

    describe('findResultForInput()', () => {

        it('returns the smallest input size result if inputSizeBytes < smallestProfiledSize', () => {
            const profiledInputSizes = [ 10, 100, 1000 ];
            const profilingResults = createProfilingResults(profiledInputSizes);
            const resultForInput = findResultForInput(9, profiledInputSizes, profilingResults);

            expect(resultForInput).toBeTruthy();
            expect(resultForInput?.inputSizeBytes).toEqual(10);
        });

        it('returns the smallest input size result if inputSizeBytes == smallestProfiledSize', () => {
            const profiledInputSizes = [ 10, 100, 1000 ];
            const profilingResults = createProfilingResults(profiledInputSizes);
            const resultForInput = findResultForInput(10, profiledInputSizes, profilingResults);

            expect(resultForInput).toBeTruthy();
            expect(resultForInput?.inputSizeBytes).toEqual(10);
        });

        it('returns the medium input size result if smallestProfiledSize < inputSizeBytes < mediumProfiledSize', () => {
            const profiledInputSizes = [ 10, 100, 1000 ];
            const profilingResults = createProfilingResults(profiledInputSizes);
            const resultForInput = findResultForInput(80, profiledInputSizes, profilingResults);

            expect(resultForInput).toBeTruthy();
            expect(resultForInput?.inputSizeBytes).toEqual(100);
        });

        it('returns the medium input size result if inputSizeBytes == mediumProfiledSize', () => {
            const profiledInputSizes = [ 10, 100, 1000 ];
            const profilingResults = createProfilingResults(profiledInputSizes);
            const resultForInput = findResultForInput(100, profiledInputSizes, profilingResults);

            expect(resultForInput).toBeTruthy();
            expect(resultForInput?.inputSizeBytes).toEqual(100);
        });

        it('returns the largest input size result if mediumProfiledSize < inputSizeBytes < largestProfiledSize', () => {
            const profiledInputSizes = [ 10, 100, 1000 ];
            const profilingResults = createProfilingResults(profiledInputSizes);
            const resultForInput = findResultForInput(400, profiledInputSizes, profilingResults);

            expect(resultForInput).toBeTruthy();
            expect(resultForInput?.inputSizeBytes).toEqual(1000);
        });

        it('returns the largest input size result if inputSizeBytes == largestProfiledSize', () => {
            const profiledInputSizes = [ 10, 100, 1000 ];
            const profilingResults = createProfilingResults(profiledInputSizes);
            const resultForInput = findResultForInput(1000, profiledInputSizes, profilingResults);

            expect(resultForInput).toBeTruthy();
            expect(resultForInput?.inputSizeBytes).toEqual(1000);
        });

        it('returns the largest input size result if inputSizeBytes > largestProfiledSize', () => {
            const profiledInputSizes = [ 10, 100, 1000 ];
            const profilingResults = createProfilingResults(profiledInputSizes);
            const resultForInput = findResultForInput(2000, profiledInputSizes, profilingResults);

            expect(resultForInput).toBeTruthy();
            expect(resultForInput?.inputSizeBytes).toEqual(1000);
        });

        it('returns undefined if mediumProfiledSize < inputSizeBytes < largestProfiledSize, but the largestProfiledSize was not profiled successfully', () => {
            const profiledInputSizes = [ 10, 100, 1000 ];
            const profilingResults = createProfilingResults([ 10, 100 ]);
            const resultForInput = findResultForInput(400, profiledInputSizes, profilingResults);

            expect(resultForInput).toBeUndefined()
        });

        it('returns undefined if inputSizeBytes > largestProfiledSize, but the largestProfiledSize was not profiled successfully', () => {
            const profiledInputSizes = [ 10, 100, 1000 ];
            const profilingResults = createProfilingResults([ 10, 100 ]);
            const resultForInput = findResultForInput(2000, profiledInputSizes, profilingResults);

            expect(resultForInput).toBeUndefined()
        });

        it('returns undefined if no profiling runs were successful', () => {
            const profiledInputSizes = [ 10, 100, 1000 ];
            const resultForInput = findResultForInput(2000, profiledInputSizes, []);

            expect(resultForInput).toBeUndefined()
        });

    });

    describe('getResultsForInput()', () => {

        it('yields the results for input size x if x occurs for every resource profile', () => {
            const profiledInputSizes = [ 10, 100, 1000 ];
            const sessionResults = createRawProfilingSessionResults(profiledInputSizes);
            sessionResults.results = [
                createResourceProfileResults('256Mib', profiledInputSizes),
                createResourceProfileResults('512Mib', profiledInputSizes),
                createResourceProfileResults('1024Mib', profiledInputSizes),
                createResourceProfileResults('2048Mib', profiledInputSizes),
            ];

            const yieldedProfiles: string[] = [];
            for (const profilingResult of getResultsForInput(sessionResults, 100)) {
                yieldedProfiles.push(profilingResult.resourceProfileId);
                expect(profilingResult.result.inputSizeBytes).toEqual(100);
            }
            expect(yieldedProfiles).toEqual([ '256Mib', '512Mib', '1024Mib', '2048Mib' ]);
        });

        it('skips the resource profiles at the beginning, where the input size x does not occur (x < largestProfiledSize)', () => {
            const profiledInputSizes = [ 10, 100, 1000 ];
            const sessionResults = createRawProfilingSessionResults(profiledInputSizes);
            sessionResults.results = [
                createResourceProfileResults('256Mib', [ 10 ]),
                createResourceProfileResults('512Mib', [ 10, 100 ]),
                createResourceProfileResults('1024Mib', profiledInputSizes),
                createResourceProfileResults('2048Mib', profiledInputSizes),
            ];

            const yieldedProfiles: string[] = [];
            for (const profilingResult of getResultsForInput(sessionResults, 100)) {
                yieldedProfiles.push(profilingResult.resourceProfileId);
                expect(profilingResult.result.inputSizeBytes).toEqual(100);
            }
            expect(yieldedProfiles).toEqual([ '512Mib', '1024Mib', '2048Mib' ]);
        });

        it('skips the resource profiles in the middle, where the input size x does not occur (and x < largestProfiledSize)', () => {
            const profiledInputSizes = [ 10, 100, 1000 ];
            const sessionResults = createRawProfilingSessionResults(profiledInputSizes);
            sessionResults.results = [
                createResourceProfileResults('256Mib', profiledInputSizes),
                createResourceProfileResults('512Mib', [ 10 ]),
                createResourceProfileResults('1024Mib', [ 10 ]),
                createResourceProfileResults('2048Mib', profiledInputSizes),
            ];

            const yieldedProfiles: string[] = [];
            for (const profilingResult of getResultsForInput(sessionResults, 100)) {
                yieldedProfiles.push(profilingResult.resourceProfileId);
                expect(profilingResult.result.inputSizeBytes).toEqual(100);
            }
            expect(yieldedProfiles).toEqual([ '256Mib', '2048Mib' ]);
        });

        it('yields results for the largest input size where appropriate (x > largestProfiledSize and largestProfiledSize was successfully profiled)', () => {
            const profiledInputSizes = [ 10, 100, 1000 ];
            const sessionResults = createRawProfilingSessionResults(profiledInputSizes);
            sessionResults.results = [
                createResourceProfileResults('256Mib', profiledInputSizes),
                createResourceProfileResults('512Mib', [ 10 ]),
                createResourceProfileResults('1024Mib', [ 10, 100 ]),
                createResourceProfileResults('2048Mib', profiledInputSizes),
            ];

            const yieldedProfiles: string[] = [];
            for (const profilingResult of getResultsForInput(sessionResults, 2000)) {
                yieldedProfiles.push(profilingResult.resourceProfileId);
                expect(profilingResult.result.inputSizeBytes).toEqual(1000);
            }
            expect(yieldedProfiles).toEqual([ '256Mib', '2048Mib' ]);
        });

        it('yields nothing if x < largestProfiledSize but larger than any successfully profiled size', () => {
            const profiledInputSizes = [ 10, 100, 1000 ];
            const sessionResults = createRawProfilingSessionResults(profiledInputSizes);
            sessionResults.results = [
                createResourceProfileResults('256Mib', [ 10 ]),
                createResourceProfileResults('512Mib', [ 10 ]),
                createResourceProfileResults('1024Mib', [ 10, 100 ]),
                createResourceProfileResults('2048Mib', [ 10, 100 ]),
            ];

            const yieldedProfiles: string[] = [];
            for (const profilingResult of getResultsForInput(sessionResults, 400)) {
                yieldedProfiles.push(profilingResult.resourceProfileId);
            }
            expect(yieldedProfiles).toEqual([ ]);
        });

    });

});
