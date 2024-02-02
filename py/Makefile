PROJECT_VERSION=0.0.3
VERSION=v$(PROJECT_VERSION)

# RELEASE_REGISTRY is the container registry to push into.
RELEASE_REGISTRY?=polarissloc
RELEASE_VERSION?=v$(PROJECT_VERSION)

# Destination folder for the generated Protobuf and gRPC code.
PROTOBUF_DEST="./bayesian_optimizer/pb"

.PHONY: gen-grpc
gen-grpc:
	python -m grpc_tools.protoc -I../go/profiler/pkg/bayesianopt --python_out="${PROTOBUF_DEST}" \
		--pyi_out="${PROTOBUF_DEST}" --grpc_python_out="${PROTOBUF_DEST}" \
		../go/profiler/pkg/bayesianopt/bayesian_optimizer.proto

docker-build:
	docker build -f ./bayesian_optimizer/Dockerfile . -t ${RELEASE_REGISTRY}/chunk-func-bayesian-optimizer:${RELEASE_VERSION}

docker-push:
	docker push ${RELEASE_REGISTRY}/chunk-func-bayesian-optimizer:${RELEASE_VERSION}
