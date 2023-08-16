# This Dockerfile assumes that the root directory of the build is the ./go directory of the repository, not the ./go/controller directory.
# Build the manager binary
FROM golang:1.20 as builder
ARG TARGETOS
ARG TARGETARCH

WORKDIR /workspace

# Copy the Go Modules manifests
COPY go.work go.work
COPY go.work.sum go.work.sum
COPY common/go.mod common/go.mod
COPY common/go.sum common/go.sum
COPY controller/go.mod controller/go.mod
COPY controller/go.sum controller/go.sum
COPY profiler/go.mod profiler/go.mod
COPY profiler/go.sum profiler/go.sum

# cache deps before building and copying source so that we don't need to re-download as much
# and so that source changes don't invalidate our downloaded layer
RUN go mod download

# Copy the go source
COPY common/pkg/ common/pkg/
COPY profiler/pkg/ profiler/pkg/
COPY controller/cmd/main.go controller/cmd/main.go
COPY controller/api/ controller/api/
COPY controller/internal/controller/ controller/internal/controller/

# Build
# the GOARCH has not a default value to allow the binary be built according to the host where the command
# was called. For example, if we call make docker-build in a local env which has the Apple Silicon M1 SO
# the docker BUILDPLATFORM arg will be linux/arm64 when for Apple x86 it will be linux/amd64. Therefore,
# by leaving it empty we can ensure that the container and binary shipped on it will have the same platform.
RUN CGO_ENABLED=0 GOOS=${TARGETOS:-linux} GOARCH=${TARGETARCH} go build -a -o manager controller/cmd/main.go

# Use distroless as minimal base image to package the manager binary
# Refer to https://github.com/GoogleContainerTools/distroless for more details
FROM gcr.io/distroless/static:nonroot
WORKDIR /
COPY --from=builder /workspace/manager .
USER 65532:65532

ENTRYPOINT ["/manager"]
