# Copyright 2023 Polaris SLO Cloud Project.
# Based on the Makefile from https://github.com/kubernetes-sigs/scheduler-plugins
# created by the Kubernetes Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

COMMONENVVAR=GOOS=$(shell uname -s | tr A-Z a-z) GOARCH=$(subst x86_64,amd64,$(patsubst i%86,386,$(shell uname -m)))
BUILDENVVAR=CGO_ENABLED=0

PROJECT_VERSION=0.0.1

# RELEASE_REGISTRY is the container registry to push into.
RELEASE_REGISTRY?=polarissloc
RELEASE_VERSION?=v$(PROJECT_VERSION)

#### ToDo: Adapt for ChunkFunc
# SCHEDULER_RELEASE_IMAGE:=polaris-scheduler:$(RELEASE_VERSION)
# CLUSTER_AGENT_RELEASE_IMAGE:=polaris-cluster-agent:$(RELEASE_VERSION)

# VERSION is the version of the components.
VERSION=v$(PROJECT_VERSION)

#### ToDo: Adapt for ChunkFunc
DEBUG_CONFIG=bin/config/kubernetes/scheduler.conf
DEBUG_CONFIG_PATH=$(shell echo "$(shell pwd)/$(DEBUG_CONFIG)" | sed -e "s|\/|\\\/|g" -)

.PHONY: all
all: build

#### ToDo: Adapt for ChunkFunc
.PHONY: build
build: build-scheduler build-cluster-agent

#### ToDo: Adapt for ChunkFunc
.PHONY: release-images
release-images: scheduler-release-image cluster-agent-release-image

.PHONY: clean
clean:
	rm -rf ./bin
	rm -rf ./vendor


#### ToDo: Adapt for ChunkFunc

###########################################
# polaris-scheduler
###########################################

.PHONY: build-scheduler
build-scheduler:
	$(COMMONENVVAR) $(BUILDENVVAR) go build -ldflags '-X k8s.io/component-base/version.gitVersion=$(VERSION) -w' -o bin/polaris-scheduler scheduler/main.go

.PHONY: build-scheduler-debug
build-scheduler-debug: scheduler-debug-config
	$(COMMONENVVAR) $(BUILDENVVAR) go build -gcflags="all=-N -l" -ldflags '-X k8s.io/component-base/version.gitVersion=$(VERSION)' -o bin/polaris-scheduler scheduler/main.go

.PHONY: scheduler-debug-config
scheduler-debug-config:
	mkdir -p ./bin
	cp scheduler/manifests/polaris-scheduler/default-polaris-scheduler-config.yaml bin/default-polaris-scheduler-config.yaml

.PHONY: scheduler-release-image
scheduler-release-image:
	docker build -f ./scheduler/Dockerfile --build-arg RELEASE_VERSION="$(RELEASE_VERSION)" -t $(RELEASE_REGISTRY)/$(SCHEDULER_RELEASE_IMAGE) .
