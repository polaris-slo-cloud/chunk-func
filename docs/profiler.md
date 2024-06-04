# ChunkFunc Profiler

The ChunkFunc Profiler is implemented as a Kubernetes controller using kubebuilder.

## Prerequisites

* Kubernetes v1.27+ cluster
* [Knative](https://knative.dev) v1.10+



## Deployment

To deploy the ChunkFunc Profiler as a Kubernetes controller open a terminal in the [go](../go) folder at the root of the repository.
By default, the controller will be deployed into the namespace `chunk-func-controller-system`.
If you would like to change the namespace, please adjust it in the file [go/controller/config/default/kustomization.yaml](../go/controller/config/default/kustomization.yaml).
The names and versions of the container images can be changed in the file [go/controller/config/manager/kustomization.yaml](../go/controller/config/manager/kustomization.yaml).

1. Adjust the environment variables of the `manager` container in the [go/controller/config/manager/manager.yaml](../go/controller/config/manager/manager.yaml) file if you do not want to use the default configuration.

2. Install the ChunkFunc CRDs.

    ```sh
    make install-crds
    ```

3. Deploy the ChunkFunc Profiler controller.

    ```sh
    make deploy-controller
    ```


## Profile a Function

To profile a function, you need to create a [FunctionDescription](../go/controller/api/v1/functiondescription_types.go) custom resource that points with metadata about the target function.
It must be deployed in the same namespace as your Knative Service object.
There are multiple examples of `FunctionDescription` objects in the subdirectories of [go/controller/config/samples](../go/controller/config/samples).

A `FunctionDescription` object has the following structure:

```YAML
apiVersion: chunk-func.polaris-slo-cloud.github.io/v1
kind: FunctionDescription
metadata:
  # Namespace of the Knative service that describes the serverless function.
  namespace: func-test

  # Arbitrary name for the FunctionDescription.
  # It is good practice to use the same name as the Knative service object.
  name: validate-video-face-recog

spec:
  functionDescription:
    # Name of the Knative service object.
    functionName: validate-video-face-recog

    # Container within an instance pod that hosts the function and its REST interface.
    functionContainer: user-container

    # Timeout for a single profiling iteration.
    maxResponseTimeMs: 4000

    # Array of typical inputs that should be used for profiling.
    typicalInputs:

      # Input 1
      - sizeBytes: 345600 # This can be the actual size of the input in bytes or a fictional size that describes the input's complexity.
        message: # An arbitrary YAML object that is specific to the REST interface of the function being profiled.
          input:
            url: http://10.152.183.40
            # This is a demo deployment, we don't care about the password here.
            user: Km64uOPSzqaR3nEy
            password: OHJUVGP5GNyIqhYcMjXezzvT8MUFSPPD
            bucket: face-detection
            objectKey: people-walking-20s-720p.mp4
            objectSizeBytes: 345600

      # Input 2
      - sizeBytes: 518400 # 20s * 1080p * 24fps
        message:
          input:
            url: http://10.152.183.40
            # This is a demo deployment, we don't care about the password here.
            user: Km64uOPSzqaR3nEy
            password: OHJUVGP5GNyIqhYcMjXezzvT8MUFSPPD
            bucket: face-detection
            objectKey: people-walking-20s-1080p.mp4
            objectSizeBytes: 518400
```

Once a `FunctionDescription` object is deployed using `kubectl apply -f`, the ChunkFunc Profiler will pick it up and start profiling automatically.
You can check the profiler's logs to see if the profiling is complete.
Once profiling is complete, the `status` subresource of the `FunctionDescription` object will be filled with the results of the profiling session.
Example results can be seen in the [go/controller/config/mockedresults](../go/controller/config/mockedresults) subdirectories.

After a complete profiling session, the `status` subresource contains two objects:
    * `profilingResults` contains the profiling results, which can be fed into the ChunkFunc Workflow optimizer.
    * `optimizedConfigs` is deprecated and can be ignored. This will be removed in the future.

