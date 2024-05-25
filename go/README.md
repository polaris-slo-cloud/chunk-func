# ChunkFunc

This Go workspace contains the following projects:

* [common](./common): reusable types and functions for ChunkFunc components
* [profiler](./profiler): main components of the ChunkFunc Profiler
* [controller](./controller): Kubernetes integration of the ChunkFunc Profiler as a controller (kubebuilder generated project)


The communication between the profiler and the bayesian-optimizer microservice, uses gRPC and protocol buffers.
To recompile the protocol buffer definitions and regenerate the gRPC stubs, the following tools are required:

* [Protobuf compiler](https://github.com/protocolbuffers/protobuf#protobuf-compiler-installation) (can be easily installed with Homebrew: `brew install protobuf`)
* Protobuf compiler plugin for Go: `go install google.golang.org/protobuf/cmd/protoc-gen-go@latest`
* gRPC generator for Go: `go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest`

To regenerate the Go part, open a terminal in the `profiler` directory and run `go generate`.
