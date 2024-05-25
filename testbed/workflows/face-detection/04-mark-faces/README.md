# Python HTTP Function

## Building and Deployment

Due to a problem with installing the `libgl1`, `libgl1-mesa-glx`, and `libglib2.0-0` packages (which are required by `opencv-python`) with `apt` through a buildpack (see GitHub [issue](https://github.com/knative/func/issues/2128)), we initially created a Dockerfile manually.
Thanks to assistance on GitHub, we were able to make the buildpack work (so `kn func build` works), but the Dockerfile produces a smaller container image.

To build and deploy this function, use `kn func deploy` or run the following:

```sh
# Build and push image
docker build . -t polarissloc/chunk-func-mark-faces:latest
docker push polarissloc/chunk-func-mark-faces:latest

# Deploy the function
kn service create mark-faces -n func-test --image polarissloc/chunk-func-mark-faces:latest
```



## Endpoints

Running this function will expose three endpoints.

  * `/` The endpoint for your function.
  * `/health/readiness` The endpoint for a readiness health check
  * `/health/liveness` The endpoint for a liveness health check

The health checks can be accessed in your browser at
[http://localhost:8080/health/readiness]() and
[http://localhost:8080/health/liveness]().

You can use `func invoke` to send an HTTP request to the function endpoint.


## Testing

This function project includes a [unit test](./test_func.py). Update this
as you add business logic to your function in order to test its behavior.

```console
python test_func.py
```
