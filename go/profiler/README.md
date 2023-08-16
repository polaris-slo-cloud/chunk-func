# ChunkFunc Profiler

The ChunkFunc profiler is used to evaluate the performance on individual serverless functions under input sizes and resource configurations.

## Profiling Process

The profiling process is outlined by the following piece of pseudocode:

```TypeScript
profileFunction(fn: ServerlessFunction, inputs: TypicalInputsOfDifferentSizes) {
    for (input in inputs) {
        profilingResults = [];
        for (resourceConfig in RESOURCE_CONFIGS) {
            executionResult = executeFunction(fn, resourceConfig, input);
            profilingResults.add(executionResult);
        }
    }

    // ToDo: Find cheapest config for each input size that fulfills the SLO.
}
```
