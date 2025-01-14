# ChunkFunc Workflow Optimizer

The ChunkFunc Workflow Optimizer is implemented using TypeScript and currently allows the execution of experiments by replaying serverless function profiling traces.
The source code is located in the [ts](../ts) directory.
Apart from the Workflow Optimizer and its libraries, the directory also contains a results-converter, which takes the JSON output of experiments and converts it into a CSV file.

The Workflow Optimizer allows using multiple resource configuration strategies for comparison.
The most important ones are:

* `ProportionalCriticalPathSloConfigStrategy`: the strategy used by ChunkFunc.
* `StepConfConfigStrategy`: [StepConf](https://doi.org/10.1109/INFOCOM48880.2022.9796962)
* `SlamConfigStrategy`: [SLAM](https://doi.org/10.1109/CLOUD55607.2022.00019)


## Prerequisites

* Node.JS v18+



## Building

To build the Workflow Optimizer and the results-converter open a terminal in the [ts](../ts) directory and execute the following steps.

1. Install dependencies.

    ```sh
    npm install
    ```

2. Build the Workflow Optimizer and the results-converter.

    ```sh
    npx nx build chunk-func-sim
    npx nx build results-converter
    ```



## Experiment Setup

There are multiple experiments in the [ts/scenarios](../ts/scenarios) folder, which you can use as a reference.

An experiment consists of the following files:

* `workflow.yaml` which describes the workflow and the profiling results.
* `scenario.yaml` which describes a specific scenario and its input sizes.

The Workflow Optimizer creates a workflow DAG from the `workflow.yaml` file and uses the output sizes in the `scenario.yaml` file to simulate the workflow execution.

### Workflow Definition File

Each step in a workflow has a unique name that can be used to reference it.
A `workflow.yaml` file looks like this:

```YAML
# The name of the workflow
name: face-detection

# The name of the start step.
startStep: validate-video-face-recog

# The name of the final step.
endStep: mark-faces

# The array of resource profiles available on the serverless platform.
availableResourceProfiles:
  - memoryMiB: 128
    milliCpu: 83
    pricePerUnit: 0.000000324
    billingUnitMs: 100
  - memoryMiB: 256
    milliCpu: 167
    pricePerUnit: 0.000000648
    billingUnitMs: 100
  # ...

# The steps of the workflow.
steps:
  # Step 1
  - name: validate-video-face-recog # Name of the step.

    # The type of step. Currently only function steps are supported.
    type: function

    # The profiling results copied from the FunctionDescription status resource.
    profilingResults:
      iterationsPerInputAndProfile: 5
      profilingDurationSeconds: 142
      profilingStarted: "2024-01-22T17:34:00Z"
      results:
      - deploymentStatus: Success
        resourceProfileId: 128mib-83m
        results:
        - executionCost: 0.000003
          executionTimeMs: 977
          inputSizeBytes: 345600
          statusCode: 200
        # ...
    
    # The successors of this step.
    # Every step needs to have at least one successor, except for the final step.
    successors:
      - transform-video

    
  # Step 2
  - name: transform-video
    type: function
    profilingResults:
    # ...
```



## Scenario Definition File

An experiment usually contains multiple scenario files to test different inputs.
A scenario file defines the input size for the workflow and the output size of every step.

```YAML
# Name of the scenario
scenarioName: scenario-01-input-60s-1080p

# The input size for the workflow.
inputSizeBytes: 1620000

# The type of SLO, for which we want to optimize:
# - MaxExecutionTime (find the cheapest configuration that has at most the specified response time)
# - MaxCost (find the fastest configuration that has at most the specified cost)
sloType: MaxExecutionTime

# The limit for the SLO
# - MaxExecutionTime: milliseconds
# - MaxCost: cost per single execution of the workflow
sloLimit: 200000

# An alternative (legacy) way to specify a MaxExecutionTime SLO.
# In this case sloType and sloLimit should not be used.
# maxResponseTimeMs: 200000

# The steps of the workflow and their output sizes.
# Each step name of the workflow must appear exactly once.
stepExecutions:
  # The name of the first step.
  validate-video-face-recog:
    # The output size of the first step.
    # This will be the input size of the second step.
    outputSizeBytes: 1620000

  transform-video:
    outputSizeBytes: 14938139
  detect-faces:
    outputSizeBytes: 1620000
  mark-faces:
    outputSizeBytes: 1620000

```



## Running an Experiment

To run an experiment open a terminal in the [ts](../ts) folder.
Run the following command:

```sh
node ./dist/packages/chunk-func-sim/main.js <path-to-workflow.yaml> <path-to-scenario.yaml> <ResourceConfigurationStrategy>

# Example:
node ./dist/packages/chunk-func-sim/main.js scenarios/face-detection/workflow-aws-bo.yaml ts/scenarios/face-detection/scenario-01.yaml ProportionalCriticalPathSloConfigStrategy
```

This will produce a JSON file as output with the response times and costs of all functions, as well as the workflow response time and cost.

If you want to use the `SlamConfigStrategy`, you need to provide an additional argument with the path to the training scenario.
This is a `scenario.yaml` file with output sizes used for training the SLAM algorithm (we use the median input sizes for this purpose).

```
node ./dist/packages/chunk-func-sim/main.js scenarios/face-detection/workflow-aws-bo.yaml ts/scenarios/face-detection/scenario-01.yaml SlamConfigStrategy scenarios/face-detection/slam-scenario.yaml
```

To execute an experiment over a range of SLOs, it is recommended to copy and adapt one of the [run-all-range.sh](../ts/scenarios/face-detection/run-all-range.sh) files.
They will also convert the results into a CSV file that is convenient for further processing.
