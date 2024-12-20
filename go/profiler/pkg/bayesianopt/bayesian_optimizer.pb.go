// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.32.0
// 	protoc        v4.25.3
// source: pkg/bayesianopt/bayesian_optimizer.proto

package bayesianopt

import (
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
	reflect "reflect"
	sync "sync"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

// Describes an inclusive integer interval.
type IntInterval struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	LowerBound uint64 `protobuf:"varint,1,opt,name=lowerBound,proto3" json:"lowerBound,omitempty"`
	UpperBound uint64 `protobuf:"varint,2,opt,name=upperBound,proto3" json:"upperBound,omitempty"`
}

func (x *IntInterval) Reset() {
	*x = IntInterval{}
	if protoimpl.UnsafeEnabled {
		mi := &file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *IntInterval) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*IntInterval) ProtoMessage() {}

func (x *IntInterval) ProtoReflect() protoreflect.Message {
	mi := &file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[0]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use IntInterval.ProtoReflect.Descriptor instead.
func (*IntInterval) Descriptor() ([]byte, []int) {
	return file_pkg_bayesianopt_bayesian_optimizer_proto_rawDescGZIP(), []int{0}
}

func (x *IntInterval) GetLowerBound() uint64 {
	if x != nil {
		return x.LowerBound
	}
	return 0
}

func (x *IntInterval) GetUpperBound() uint64 {
	if x != nil {
		return x.UpperBound
	}
	return 0
}

// Collects data needed to initialize a new BO model.
// Either possibleXValues or interval is needed, the other two values are optional.
type BoModelInitData struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	// The discrete set of possible values of X.
	PossibleXValues []uint64 `protobuf:"varint,1,rep,packed,name=possibleXValues,proto3" json:"possibleXValues,omitempty"`
	// An inclusive integer interval for the possible values of X.
	Interval *IntInterval `protobuf:"bytes,2,opt,name=interval,proto3,oneof" json:"interval,omitempty"`
	Kappa    *float64     `protobuf:"fixed64,3,opt,name=kappa,proto3,oneof" json:"kappa,omitempty"`
	Xi       *float64     `protobuf:"fixed64,4,opt,name=xi,proto3,oneof" json:"xi,omitempty"`
	// The maximum number of samples after which BO should stop (poi will drop to zero).
	// This number is expressed as a percentage of the number of values in the input domain.
	// The valid range is [0.0, 1.0] with 0.0 mapping to the default of 1.0.
	MaxSamplesPercent float64 `protobuf:"fixed64,5,opt,name=maxSamplesPercent,proto3" json:"maxSamplesPercent,omitempty"`
}

func (x *BoModelInitData) Reset() {
	*x = BoModelInitData{}
	if protoimpl.UnsafeEnabled {
		mi := &file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[1]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *BoModelInitData) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*BoModelInitData) ProtoMessage() {}

func (x *BoModelInitData) ProtoReflect() protoreflect.Message {
	mi := &file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[1]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use BoModelInitData.ProtoReflect.Descriptor instead.
func (*BoModelInitData) Descriptor() ([]byte, []int) {
	return file_pkg_bayesianopt_bayesian_optimizer_proto_rawDescGZIP(), []int{1}
}

func (x *BoModelInitData) GetPossibleXValues() []uint64 {
	if x != nil {
		return x.PossibleXValues
	}
	return nil
}

func (x *BoModelInitData) GetInterval() *IntInterval {
	if x != nil {
		return x.Interval
	}
	return nil
}

func (x *BoModelInitData) GetKappa() float64 {
	if x != nil && x.Kappa != nil {
		return *x.Kappa
	}
	return 0
}

func (x *BoModelInitData) GetXi() float64 {
	if x != nil && x.Xi != nil {
		return *x.Xi
	}
	return 0
}

func (x *BoModelInitData) GetMaxSamplesPercent() float64 {
	if x != nil {
		return x.MaxSamplesPercent
	}
	return 0
}

type BoModelId struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	ModelId string `protobuf:"bytes,1,opt,name=modelId,proto3" json:"modelId,omitempty"`
}

func (x *BoModelId) Reset() {
	*x = BoModelId{}
	if protoimpl.UnsafeEnabled {
		mi := &file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[2]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *BoModelId) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*BoModelId) ProtoMessage() {}

func (x *BoModelId) ProtoReflect() protoreflect.Message {
	mi := &file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[2]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use BoModelId.ProtoReflect.Descriptor instead.
func (*BoModelId) Descriptor() ([]byte, []int) {
	return file_pkg_bayesianopt_bayesian_optimizer_proto_rawDescGZIP(), []int{2}
}

func (x *BoModelId) GetModelId() string {
	if x != nil {
		return x.ModelId
	}
	return ""
}

type BoSuggestion struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	// The suggested value of X for the next profiling run.
	X uint64 `protobuf:"varint,1,opt,name=x,proto3" json:"x,omitempty"`
	// Probability of improvement for the next profiling run.
	// If this is zero, the value of X must be disregarded, because the input domain has been exhausted.
	Poi float64 `protobuf:"fixed64,2,opt,name=poi,proto3" json:"poi,omitempty"`
	// The percentage of all possible X-values, which were already sampled.
	// This only includes X-values, for which a Y-value has already been observed.
	// So, the X-value from this suggestion is not included.
	PercentageSampled float64 `protobuf:"fixed64,3,opt,name=percentageSampled,proto3" json:"percentageSampled,omitempty"`
}

func (x *BoSuggestion) Reset() {
	*x = BoSuggestion{}
	if protoimpl.UnsafeEnabled {
		mi := &file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[3]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *BoSuggestion) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*BoSuggestion) ProtoMessage() {}

func (x *BoSuggestion) ProtoReflect() protoreflect.Message {
	mi := &file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[3]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use BoSuggestion.ProtoReflect.Descriptor instead.
func (*BoSuggestion) Descriptor() ([]byte, []int) {
	return file_pkg_bayesianopt_bayesian_optimizer_proto_rawDescGZIP(), []int{3}
}

func (x *BoSuggestion) GetX() uint64 {
	if x != nil {
		return x.X
	}
	return 0
}

func (x *BoSuggestion) GetPoi() float64 {
	if x != nil {
		return x.Poi
	}
	return 0
}

func (x *BoSuggestion) GetPercentageSampled() float64 {
	if x != nil {
		return x.PercentageSampled
	}
	return 0
}

// The observation made during a profiling run.
type BoObservation struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	// The value of X, for which the profiling was executed.
	X uint64 `protobuf:"varint,1,opt,name=x,proto3" json:"x,omitempty"`
	// The result of the profiling.
	Observation float64 `protobuf:"fixed64,2,opt,name=observation,proto3" json:"observation,omitempty"`
}

func (x *BoObservation) Reset() {
	*x = BoObservation{}
	if protoimpl.UnsafeEnabled {
		mi := &file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[4]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *BoObservation) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*BoObservation) ProtoMessage() {}

func (x *BoObservation) ProtoReflect() protoreflect.Message {
	mi := &file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[4]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use BoObservation.ProtoReflect.Descriptor instead.
func (*BoObservation) Descriptor() ([]byte, []int) {
	return file_pkg_bayesianopt_bayesian_optimizer_proto_rawDescGZIP(), []int{4}
}

func (x *BoObservation) GetX() uint64 {
	if x != nil {
		return x.X
	}
	return 0
}

func (x *BoObservation) GetObservation() float64 {
	if x != nil {
		return x.Observation
	}
	return 0
}

// Requests a new suggestion for the next X value and
// optionally submits an observation from the previous profiling run.
type GetBoSuggestionRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	// The ID of the model to be used.
	ModelId string `protobuf:"bytes,1,opt,name=modelId,proto3" json:"modelId,omitempty"`
	// (optional) The observation from the last profiling run.
	Observation *BoObservation `protobuf:"bytes,2,opt,name=observation,proto3,oneof" json:"observation,omitempty"`
}

func (x *GetBoSuggestionRequest) Reset() {
	*x = GetBoSuggestionRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[5]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *GetBoSuggestionRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*GetBoSuggestionRequest) ProtoMessage() {}

func (x *GetBoSuggestionRequest) ProtoReflect() protoreflect.Message {
	mi := &file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[5]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use GetBoSuggestionRequest.ProtoReflect.Descriptor instead.
func (*GetBoSuggestionRequest) Descriptor() ([]byte, []int) {
	return file_pkg_bayesianopt_bayesian_optimizer_proto_rawDescGZIP(), []int{5}
}

func (x *GetBoSuggestionRequest) GetModelId() string {
	if x != nil {
		return x.ModelId
	}
	return ""
}

func (x *GetBoSuggestionRequest) GetObservation() *BoObservation {
	if x != nil {
		return x.Observation
	}
	return nil
}

// Delivers a suggestion from a BO model.
type GetBoSuggestionResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	// The ID of the model that was used.
	ModelId string `protobuf:"bytes,1,opt,name=modelId,proto3" json:"modelId,omitempty"`
	// The suggested value of X and the expected improvement.
	Suggestion *BoSuggestion `protobuf:"bytes,2,opt,name=suggestion,proto3" json:"suggestion,omitempty"`
}

func (x *GetBoSuggestionResponse) Reset() {
	*x = GetBoSuggestionResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[6]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *GetBoSuggestionResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*GetBoSuggestionResponse) ProtoMessage() {}

func (x *GetBoSuggestionResponse) ProtoReflect() protoreflect.Message {
	mi := &file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[6]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use GetBoSuggestionResponse.ProtoReflect.Descriptor instead.
func (*GetBoSuggestionResponse) Descriptor() ([]byte, []int) {
	return file_pkg_bayesianopt_bayesian_optimizer_proto_rawDescGZIP(), []int{6}
}

func (x *GetBoSuggestionResponse) GetModelId() string {
	if x != nil {
		return x.ModelId
	}
	return ""
}

func (x *GetBoSuggestionResponse) GetSuggestion() *BoSuggestion {
	if x != nil {
		return x.Suggestion
	}
	return nil
}

// Requests an inference for a specific X.
type InferYRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	// The ID of the model that was used.
	ModelId string `protobuf:"bytes,1,opt,name=modelId,proto3" json:"modelId,omitempty"`
	// The value of X, for which we want to infer Y.
	X uint64 `protobuf:"varint,2,opt,name=x,proto3" json:"x,omitempty"`
}

func (x *InferYRequest) Reset() {
	*x = InferYRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[7]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *InferYRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*InferYRequest) ProtoMessage() {}

func (x *InferYRequest) ProtoReflect() protoreflect.Message {
	mi := &file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[7]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use InferYRequest.ProtoReflect.Descriptor instead.
func (*InferYRequest) Descriptor() ([]byte, []int) {
	return file_pkg_bayesianopt_bayesian_optimizer_proto_rawDescGZIP(), []int{7}
}

func (x *InferYRequest) GetModelId() string {
	if x != nil {
		return x.ModelId
	}
	return ""
}

func (x *InferYRequest) GetX() uint64 {
	if x != nil {
		return x.X
	}
	return 0
}

// Delivers an inference for a specific X.
type InferYResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	// The ID of the model that was used.
	ModelId string `protobuf:"bytes,1,opt,name=modelId,proto3" json:"modelId,omitempty"`
	// The value of X, for which we requested Y.
	X uint64 `protobuf:"varint,2,opt,name=x,proto3" json:"x,omitempty"`
	// The inferred Y value at position X.
	Y float64 `protobuf:"fixed64,3,opt,name=y,proto3" json:"y,omitempty"`
}

func (x *InferYResponse) Reset() {
	*x = InferYResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[8]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *InferYResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*InferYResponse) ProtoMessage() {}

func (x *InferYResponse) ProtoReflect() protoreflect.Message {
	mi := &file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[8]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use InferYResponse.ProtoReflect.Descriptor instead.
func (*InferYResponse) Descriptor() ([]byte, []int) {
	return file_pkg_bayesianopt_bayesian_optimizer_proto_rawDescGZIP(), []int{8}
}

func (x *InferYResponse) GetModelId() string {
	if x != nil {
		return x.ModelId
	}
	return ""
}

func (x *InferYResponse) GetX() uint64 {
	if x != nil {
		return x.X
	}
	return 0
}

func (x *InferYResponse) GetY() float64 {
	if x != nil {
		return x.Y
	}
	return 0
}

// Shrinks the input domain of an existing BO model.
type ShrinkInputDomainRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	// The ID of the model to be used.
	ModelId string `protobuf:"bytes,1,opt,name=modelId,proto3" json:"modelId,omitempty"`
	// The discrete set of possible values of X.
	PossibleXValues []uint64 `protobuf:"varint,2,rep,packed,name=possibleXValues,proto3" json:"possibleXValues,omitempty"`
	// An inclusive integer interval for the possible values of X.
	Interval *IntInterval `protobuf:"bytes,3,opt,name=interval,proto3,oneof" json:"interval,omitempty"`
}

func (x *ShrinkInputDomainRequest) Reset() {
	*x = ShrinkInputDomainRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[9]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *ShrinkInputDomainRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ShrinkInputDomainRequest) ProtoMessage() {}

func (x *ShrinkInputDomainRequest) ProtoReflect() protoreflect.Message {
	mi := &file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[9]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ShrinkInputDomainRequest.ProtoReflect.Descriptor instead.
func (*ShrinkInputDomainRequest) Descriptor() ([]byte, []int) {
	return file_pkg_bayesianopt_bayesian_optimizer_proto_rawDescGZIP(), []int{9}
}

func (x *ShrinkInputDomainRequest) GetModelId() string {
	if x != nil {
		return x.ModelId
	}
	return ""
}

func (x *ShrinkInputDomainRequest) GetPossibleXValues() []uint64 {
	if x != nil {
		return x.PossibleXValues
	}
	return nil
}

func (x *ShrinkInputDomainRequest) GetInterval() *IntInterval {
	if x != nil {
		return x.Interval
	}
	return nil
}

// Response to shrinking the input domain.
type ShrinkInputDomainResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	// The ID of the model to be used.
	ModelId string `protobuf:"bytes,1,opt,name=modelId,proto3" json:"modelId,omitempty"`
	// The number of remaining values in the input domain, for which no observation had been made.
	RemainingXValuesCount uint64 `protobuf:"varint,2,opt,name=remainingXValuesCount,proto3" json:"remainingXValuesCount,omitempty"`
}

func (x *ShrinkInputDomainResponse) Reset() {
	*x = ShrinkInputDomainResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[10]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *ShrinkInputDomainResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ShrinkInputDomainResponse) ProtoMessage() {}

func (x *ShrinkInputDomainResponse) ProtoReflect() protoreflect.Message {
	mi := &file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[10]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ShrinkInputDomainResponse.ProtoReflect.Descriptor instead.
func (*ShrinkInputDomainResponse) Descriptor() ([]byte, []int) {
	return file_pkg_bayesianopt_bayesian_optimizer_proto_rawDescGZIP(), []int{10}
}

func (x *ShrinkInputDomainResponse) GetModelId() string {
	if x != nil {
		return x.ModelId
	}
	return ""
}

func (x *ShrinkInputDomainResponse) GetRemainingXValuesCount() uint64 {
	if x != nil {
		return x.RemainingXValuesCount
	}
	return 0
}

var File_pkg_bayesianopt_bayesian_optimizer_proto protoreflect.FileDescriptor

var file_pkg_bayesianopt_bayesian_optimizer_proto_rawDesc = []byte{
	0x0a, 0x28, 0x70, 0x6b, 0x67, 0x2f, 0x62, 0x61, 0x79, 0x65, 0x73, 0x69, 0x61, 0x6e, 0x6f, 0x70,
	0x74, 0x2f, 0x62, 0x61, 0x79, 0x65, 0x73, 0x69, 0x61, 0x6e, 0x5f, 0x6f, 0x70, 0x74, 0x69, 0x6d,
	0x69, 0x7a, 0x65, 0x72, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x12, 0x0b, 0x62, 0x61, 0x79, 0x65,
	0x73, 0x69, 0x61, 0x6e, 0x6f, 0x70, 0x74, 0x22, 0x4d, 0x0a, 0x0b, 0x49, 0x6e, 0x74, 0x49, 0x6e,
	0x74, 0x65, 0x72, 0x76, 0x61, 0x6c, 0x12, 0x1e, 0x0a, 0x0a, 0x6c, 0x6f, 0x77, 0x65, 0x72, 0x42,
	0x6f, 0x75, 0x6e, 0x64, 0x18, 0x01, 0x20, 0x01, 0x28, 0x04, 0x52, 0x0a, 0x6c, 0x6f, 0x77, 0x65,
	0x72, 0x42, 0x6f, 0x75, 0x6e, 0x64, 0x12, 0x1e, 0x0a, 0x0a, 0x75, 0x70, 0x70, 0x65, 0x72, 0x42,
	0x6f, 0x75, 0x6e, 0x64, 0x18, 0x02, 0x20, 0x01, 0x28, 0x04, 0x52, 0x0a, 0x75, 0x70, 0x70, 0x65,
	0x72, 0x42, 0x6f, 0x75, 0x6e, 0x64, 0x22, 0xf2, 0x01, 0x0a, 0x0f, 0x42, 0x6f, 0x4d, 0x6f, 0x64,
	0x65, 0x6c, 0x49, 0x6e, 0x69, 0x74, 0x44, 0x61, 0x74, 0x61, 0x12, 0x28, 0x0a, 0x0f, 0x70, 0x6f,
	0x73, 0x73, 0x69, 0x62, 0x6c, 0x65, 0x58, 0x56, 0x61, 0x6c, 0x75, 0x65, 0x73, 0x18, 0x01, 0x20,
	0x03, 0x28, 0x04, 0x52, 0x0f, 0x70, 0x6f, 0x73, 0x73, 0x69, 0x62, 0x6c, 0x65, 0x58, 0x56, 0x61,
	0x6c, 0x75, 0x65, 0x73, 0x12, 0x39, 0x0a, 0x08, 0x69, 0x6e, 0x74, 0x65, 0x72, 0x76, 0x61, 0x6c,
	0x18, 0x02, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x18, 0x2e, 0x62, 0x61, 0x79, 0x65, 0x73, 0x69, 0x61,
	0x6e, 0x6f, 0x70, 0x74, 0x2e, 0x49, 0x6e, 0x74, 0x49, 0x6e, 0x74, 0x65, 0x72, 0x76, 0x61, 0x6c,
	0x48, 0x00, 0x52, 0x08, 0x69, 0x6e, 0x74, 0x65, 0x72, 0x76, 0x61, 0x6c, 0x88, 0x01, 0x01, 0x12,
	0x19, 0x0a, 0x05, 0x6b, 0x61, 0x70, 0x70, 0x61, 0x18, 0x03, 0x20, 0x01, 0x28, 0x01, 0x48, 0x01,
	0x52, 0x05, 0x6b, 0x61, 0x70, 0x70, 0x61, 0x88, 0x01, 0x01, 0x12, 0x13, 0x0a, 0x02, 0x78, 0x69,
	0x18, 0x04, 0x20, 0x01, 0x28, 0x01, 0x48, 0x02, 0x52, 0x02, 0x78, 0x69, 0x88, 0x01, 0x01, 0x12,
	0x2c, 0x0a, 0x11, 0x6d, 0x61, 0x78, 0x53, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x73, 0x50, 0x65, 0x72,
	0x63, 0x65, 0x6e, 0x74, 0x18, 0x05, 0x20, 0x01, 0x28, 0x01, 0x52, 0x11, 0x6d, 0x61, 0x78, 0x53,
	0x61, 0x6d, 0x70, 0x6c, 0x65, 0x73, 0x50, 0x65, 0x72, 0x63, 0x65, 0x6e, 0x74, 0x42, 0x0b, 0x0a,
	0x09, 0x5f, 0x69, 0x6e, 0x74, 0x65, 0x72, 0x76, 0x61, 0x6c, 0x42, 0x08, 0x0a, 0x06, 0x5f, 0x6b,
	0x61, 0x70, 0x70, 0x61, 0x42, 0x05, 0x0a, 0x03, 0x5f, 0x78, 0x69, 0x22, 0x25, 0x0a, 0x09, 0x42,
	0x6f, 0x4d, 0x6f, 0x64, 0x65, 0x6c, 0x49, 0x64, 0x12, 0x18, 0x0a, 0x07, 0x6d, 0x6f, 0x64, 0x65,
	0x6c, 0x49, 0x64, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x6d, 0x6f, 0x64, 0x65, 0x6c,
	0x49, 0x64, 0x22, 0x5c, 0x0a, 0x0c, 0x42, 0x6f, 0x53, 0x75, 0x67, 0x67, 0x65, 0x73, 0x74, 0x69,
	0x6f, 0x6e, 0x12, 0x0c, 0x0a, 0x01, 0x78, 0x18, 0x01, 0x20, 0x01, 0x28, 0x04, 0x52, 0x01, 0x78,
	0x12, 0x10, 0x0a, 0x03, 0x70, 0x6f, 0x69, 0x18, 0x02, 0x20, 0x01, 0x28, 0x01, 0x52, 0x03, 0x70,
	0x6f, 0x69, 0x12, 0x2c, 0x0a, 0x11, 0x70, 0x65, 0x72, 0x63, 0x65, 0x6e, 0x74, 0x61, 0x67, 0x65,
	0x53, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x64, 0x18, 0x03, 0x20, 0x01, 0x28, 0x01, 0x52, 0x11, 0x70,
	0x65, 0x72, 0x63, 0x65, 0x6e, 0x74, 0x61, 0x67, 0x65, 0x53, 0x61, 0x6d, 0x70, 0x6c, 0x65, 0x64,
	0x22, 0x3f, 0x0a, 0x0d, 0x42, 0x6f, 0x4f, 0x62, 0x73, 0x65, 0x72, 0x76, 0x61, 0x74, 0x69, 0x6f,
	0x6e, 0x12, 0x0c, 0x0a, 0x01, 0x78, 0x18, 0x01, 0x20, 0x01, 0x28, 0x04, 0x52, 0x01, 0x78, 0x12,
	0x20, 0x0a, 0x0b, 0x6f, 0x62, 0x73, 0x65, 0x72, 0x76, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x18, 0x02,
	0x20, 0x01, 0x28, 0x01, 0x52, 0x0b, 0x6f, 0x62, 0x73, 0x65, 0x72, 0x76, 0x61, 0x74, 0x69, 0x6f,
	0x6e, 0x22, 0x85, 0x01, 0x0a, 0x16, 0x47, 0x65, 0x74, 0x42, 0x6f, 0x53, 0x75, 0x67, 0x67, 0x65,
	0x73, 0x74, 0x69, 0x6f, 0x6e, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x18, 0x0a, 0x07,
	0x6d, 0x6f, 0x64, 0x65, 0x6c, 0x49, 0x64, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x6d,
	0x6f, 0x64, 0x65, 0x6c, 0x49, 0x64, 0x12, 0x41, 0x0a, 0x0b, 0x6f, 0x62, 0x73, 0x65, 0x72, 0x76,
	0x61, 0x74, 0x69, 0x6f, 0x6e, 0x18, 0x02, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x1a, 0x2e, 0x62, 0x61,
	0x79, 0x65, 0x73, 0x69, 0x61, 0x6e, 0x6f, 0x70, 0x74, 0x2e, 0x42, 0x6f, 0x4f, 0x62, 0x73, 0x65,
	0x72, 0x76, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x48, 0x00, 0x52, 0x0b, 0x6f, 0x62, 0x73, 0x65, 0x72,
	0x76, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x88, 0x01, 0x01, 0x42, 0x0e, 0x0a, 0x0c, 0x5f, 0x6f, 0x62,
	0x73, 0x65, 0x72, 0x76, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x22, 0x6e, 0x0a, 0x17, 0x47, 0x65, 0x74,
	0x42, 0x6f, 0x53, 0x75, 0x67, 0x67, 0x65, 0x73, 0x74, 0x69, 0x6f, 0x6e, 0x52, 0x65, 0x73, 0x70,
	0x6f, 0x6e, 0x73, 0x65, 0x12, 0x18, 0x0a, 0x07, 0x6d, 0x6f, 0x64, 0x65, 0x6c, 0x49, 0x64, 0x18,
	0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x6d, 0x6f, 0x64, 0x65, 0x6c, 0x49, 0x64, 0x12, 0x39,
	0x0a, 0x0a, 0x73, 0x75, 0x67, 0x67, 0x65, 0x73, 0x74, 0x69, 0x6f, 0x6e, 0x18, 0x02, 0x20, 0x01,
	0x28, 0x0b, 0x32, 0x19, 0x2e, 0x62, 0x61, 0x79, 0x65, 0x73, 0x69, 0x61, 0x6e, 0x6f, 0x70, 0x74,
	0x2e, 0x42, 0x6f, 0x53, 0x75, 0x67, 0x67, 0x65, 0x73, 0x74, 0x69, 0x6f, 0x6e, 0x52, 0x0a, 0x73,
	0x75, 0x67, 0x67, 0x65, 0x73, 0x74, 0x69, 0x6f, 0x6e, 0x22, 0x37, 0x0a, 0x0d, 0x49, 0x6e, 0x66,
	0x65, 0x72, 0x59, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x18, 0x0a, 0x07, 0x6d, 0x6f,
	0x64, 0x65, 0x6c, 0x49, 0x64, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x6d, 0x6f, 0x64,
	0x65, 0x6c, 0x49, 0x64, 0x12, 0x0c, 0x0a, 0x01, 0x78, 0x18, 0x02, 0x20, 0x01, 0x28, 0x04, 0x52,
	0x01, 0x78, 0x22, 0x46, 0x0a, 0x0e, 0x49, 0x6e, 0x66, 0x65, 0x72, 0x59, 0x52, 0x65, 0x73, 0x70,
	0x6f, 0x6e, 0x73, 0x65, 0x12, 0x18, 0x0a, 0x07, 0x6d, 0x6f, 0x64, 0x65, 0x6c, 0x49, 0x64, 0x18,
	0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x6d, 0x6f, 0x64, 0x65, 0x6c, 0x49, 0x64, 0x12, 0x0c,
	0x0a, 0x01, 0x78, 0x18, 0x02, 0x20, 0x01, 0x28, 0x04, 0x52, 0x01, 0x78, 0x12, 0x0c, 0x0a, 0x01,
	0x79, 0x18, 0x03, 0x20, 0x01, 0x28, 0x01, 0x52, 0x01, 0x79, 0x22, 0xa6, 0x01, 0x0a, 0x18, 0x53,
	0x68, 0x72, 0x69, 0x6e, 0x6b, 0x49, 0x6e, 0x70, 0x75, 0x74, 0x44, 0x6f, 0x6d, 0x61, 0x69, 0x6e,
	0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x18, 0x0a, 0x07, 0x6d, 0x6f, 0x64, 0x65, 0x6c,
	0x49, 0x64, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x6d, 0x6f, 0x64, 0x65, 0x6c, 0x49,
	0x64, 0x12, 0x28, 0x0a, 0x0f, 0x70, 0x6f, 0x73, 0x73, 0x69, 0x62, 0x6c, 0x65, 0x58, 0x56, 0x61,
	0x6c, 0x75, 0x65, 0x73, 0x18, 0x02, 0x20, 0x03, 0x28, 0x04, 0x52, 0x0f, 0x70, 0x6f, 0x73, 0x73,
	0x69, 0x62, 0x6c, 0x65, 0x58, 0x56, 0x61, 0x6c, 0x75, 0x65, 0x73, 0x12, 0x39, 0x0a, 0x08, 0x69,
	0x6e, 0x74, 0x65, 0x72, 0x76, 0x61, 0x6c, 0x18, 0x03, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x18, 0x2e,
	0x62, 0x61, 0x79, 0x65, 0x73, 0x69, 0x61, 0x6e, 0x6f, 0x70, 0x74, 0x2e, 0x49, 0x6e, 0x74, 0x49,
	0x6e, 0x74, 0x65, 0x72, 0x76, 0x61, 0x6c, 0x48, 0x00, 0x52, 0x08, 0x69, 0x6e, 0x74, 0x65, 0x72,
	0x76, 0x61, 0x6c, 0x88, 0x01, 0x01, 0x42, 0x0b, 0x0a, 0x09, 0x5f, 0x69, 0x6e, 0x74, 0x65, 0x72,
	0x76, 0x61, 0x6c, 0x22, 0x6b, 0x0a, 0x19, 0x53, 0x68, 0x72, 0x69, 0x6e, 0x6b, 0x49, 0x6e, 0x70,
	0x75, 0x74, 0x44, 0x6f, 0x6d, 0x61, 0x69, 0x6e, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65,
	0x12, 0x18, 0x0a, 0x07, 0x6d, 0x6f, 0x64, 0x65, 0x6c, 0x49, 0x64, 0x18, 0x01, 0x20, 0x01, 0x28,
	0x09, 0x52, 0x07, 0x6d, 0x6f, 0x64, 0x65, 0x6c, 0x49, 0x64, 0x12, 0x34, 0x0a, 0x15, 0x72, 0x65,
	0x6d, 0x61, 0x69, 0x6e, 0x69, 0x6e, 0x67, 0x58, 0x56, 0x61, 0x6c, 0x75, 0x65, 0x73, 0x43, 0x6f,
	0x75, 0x6e, 0x74, 0x18, 0x02, 0x20, 0x01, 0x28, 0x04, 0x52, 0x15, 0x72, 0x65, 0x6d, 0x61, 0x69,
	0x6e, 0x69, 0x6e, 0x67, 0x58, 0x56, 0x61, 0x6c, 0x75, 0x65, 0x73, 0x43, 0x6f, 0x75, 0x6e, 0x74,
	0x32, 0xb1, 0x03, 0x0a, 0x18, 0x42, 0x61, 0x79, 0x65, 0x73, 0x69, 0x61, 0x6e, 0x4f, 0x70, 0x74,
	0x69, 0x6d, 0x69, 0x7a, 0x65, 0x72, 0x53, 0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x12, 0x47, 0x0a,
	0x0d, 0x43, 0x72, 0x65, 0x61, 0x74, 0x65, 0x42, 0x6f, 0x4d, 0x6f, 0x64, 0x65, 0x6c, 0x12, 0x1c,
	0x2e, 0x62, 0x61, 0x79, 0x65, 0x73, 0x69, 0x61, 0x6e, 0x6f, 0x70, 0x74, 0x2e, 0x42, 0x6f, 0x4d,
	0x6f, 0x64, 0x65, 0x6c, 0x49, 0x6e, 0x69, 0x74, 0x44, 0x61, 0x74, 0x61, 0x1a, 0x16, 0x2e, 0x62,
	0x61, 0x79, 0x65, 0x73, 0x69, 0x61, 0x6e, 0x6f, 0x70, 0x74, 0x2e, 0x42, 0x6f, 0x4d, 0x6f, 0x64,
	0x65, 0x6c, 0x49, 0x64, 0x22, 0x00, 0x12, 0x5e, 0x0a, 0x0f, 0x47, 0x65, 0x74, 0x42, 0x6f, 0x53,
	0x75, 0x67, 0x67, 0x65, 0x73, 0x74, 0x69, 0x6f, 0x6e, 0x12, 0x23, 0x2e, 0x62, 0x61, 0x79, 0x65,
	0x73, 0x69, 0x61, 0x6e, 0x6f, 0x70, 0x74, 0x2e, 0x47, 0x65, 0x74, 0x42, 0x6f, 0x53, 0x75, 0x67,
	0x67, 0x65, 0x73, 0x74, 0x69, 0x6f, 0x6e, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x24,
	0x2e, 0x62, 0x61, 0x79, 0x65, 0x73, 0x69, 0x61, 0x6e, 0x6f, 0x70, 0x74, 0x2e, 0x47, 0x65, 0x74,
	0x42, 0x6f, 0x53, 0x75, 0x67, 0x67, 0x65, 0x73, 0x74, 0x69, 0x6f, 0x6e, 0x52, 0x65, 0x73, 0x70,
	0x6f, 0x6e, 0x73, 0x65, 0x22, 0x00, 0x12, 0x43, 0x0a, 0x06, 0x49, 0x6e, 0x66, 0x65, 0x72, 0x59,
	0x12, 0x1a, 0x2e, 0x62, 0x61, 0x79, 0x65, 0x73, 0x69, 0x61, 0x6e, 0x6f, 0x70, 0x74, 0x2e, 0x49,
	0x6e, 0x66, 0x65, 0x72, 0x59, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x1b, 0x2e, 0x62,
	0x61, 0x79, 0x65, 0x73, 0x69, 0x61, 0x6e, 0x6f, 0x70, 0x74, 0x2e, 0x49, 0x6e, 0x66, 0x65, 0x72,
	0x59, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x22, 0x00, 0x12, 0x64, 0x0a, 0x11, 0x53,
	0x68, 0x72, 0x69, 0x6e, 0x6b, 0x49, 0x6e, 0x70, 0x75, 0x74, 0x44, 0x6f, 0x6d, 0x61, 0x69, 0x6e,
	0x12, 0x25, 0x2e, 0x62, 0x61, 0x79, 0x65, 0x73, 0x69, 0x61, 0x6e, 0x6f, 0x70, 0x74, 0x2e, 0x53,
	0x68, 0x72, 0x69, 0x6e, 0x6b, 0x49, 0x6e, 0x70, 0x75, 0x74, 0x44, 0x6f, 0x6d, 0x61, 0x69, 0x6e,
	0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x26, 0x2e, 0x62, 0x61, 0x79, 0x65, 0x73, 0x69,
	0x61, 0x6e, 0x6f, 0x70, 0x74, 0x2e, 0x53, 0x68, 0x72, 0x69, 0x6e, 0x6b, 0x49, 0x6e, 0x70, 0x75,
	0x74, 0x44, 0x6f, 0x6d, 0x61, 0x69, 0x6e, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x22,
	0x00, 0x12, 0x41, 0x0a, 0x0d, 0x44, 0x65, 0x6c, 0x65, 0x74, 0x65, 0x42, 0x6f, 0x4d, 0x6f, 0x64,
	0x65, 0x6c, 0x12, 0x16, 0x2e, 0x62, 0x61, 0x79, 0x65, 0x73, 0x69, 0x61, 0x6e, 0x6f, 0x70, 0x74,
	0x2e, 0x42, 0x6f, 0x4d, 0x6f, 0x64, 0x65, 0x6c, 0x49, 0x64, 0x1a, 0x16, 0x2e, 0x62, 0x61, 0x79,
	0x65, 0x73, 0x69, 0x61, 0x6e, 0x6f, 0x70, 0x74, 0x2e, 0x42, 0x6f, 0x4d, 0x6f, 0x64, 0x65, 0x6c,
	0x49, 0x64, 0x22, 0x00, 0x42, 0x41, 0x5a, 0x3f, 0x70, 0x6f, 0x6c, 0x61, 0x72, 0x69, 0x73, 0x2d,
	0x73, 0x6c, 0x6f, 0x2d, 0x63, 0x6c, 0x6f, 0x75, 0x64, 0x2e, 0x67, 0x69, 0x74, 0x68, 0x75, 0x62,
	0x2e, 0x69, 0x6f, 0x2f, 0x63, 0x68, 0x75, 0x6e, 0x6b, 0x2d, 0x66, 0x75, 0x6e, 0x63, 0x2f, 0x70,
	0x72, 0x6f, 0x66, 0x69, 0x6c, 0x65, 0x72, 0x2f, 0x70, 0x6b, 0x67, 0x2f, 0x62, 0x61, 0x79, 0x65,
	0x73, 0x69, 0x61, 0x6e, 0x6f, 0x70, 0x74, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_pkg_bayesianopt_bayesian_optimizer_proto_rawDescOnce sync.Once
	file_pkg_bayesianopt_bayesian_optimizer_proto_rawDescData = file_pkg_bayesianopt_bayesian_optimizer_proto_rawDesc
)

func file_pkg_bayesianopt_bayesian_optimizer_proto_rawDescGZIP() []byte {
	file_pkg_bayesianopt_bayesian_optimizer_proto_rawDescOnce.Do(func() {
		file_pkg_bayesianopt_bayesian_optimizer_proto_rawDescData = protoimpl.X.CompressGZIP(file_pkg_bayesianopt_bayesian_optimizer_proto_rawDescData)
	})
	return file_pkg_bayesianopt_bayesian_optimizer_proto_rawDescData
}

var file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes = make([]protoimpl.MessageInfo, 11)
var file_pkg_bayesianopt_bayesian_optimizer_proto_goTypes = []interface{}{
	(*IntInterval)(nil),               // 0: bayesianopt.IntInterval
	(*BoModelInitData)(nil),           // 1: bayesianopt.BoModelInitData
	(*BoModelId)(nil),                 // 2: bayesianopt.BoModelId
	(*BoSuggestion)(nil),              // 3: bayesianopt.BoSuggestion
	(*BoObservation)(nil),             // 4: bayesianopt.BoObservation
	(*GetBoSuggestionRequest)(nil),    // 5: bayesianopt.GetBoSuggestionRequest
	(*GetBoSuggestionResponse)(nil),   // 6: bayesianopt.GetBoSuggestionResponse
	(*InferYRequest)(nil),             // 7: bayesianopt.InferYRequest
	(*InferYResponse)(nil),            // 8: bayesianopt.InferYResponse
	(*ShrinkInputDomainRequest)(nil),  // 9: bayesianopt.ShrinkInputDomainRequest
	(*ShrinkInputDomainResponse)(nil), // 10: bayesianopt.ShrinkInputDomainResponse
}
var file_pkg_bayesianopt_bayesian_optimizer_proto_depIdxs = []int32{
	0,  // 0: bayesianopt.BoModelInitData.interval:type_name -> bayesianopt.IntInterval
	4,  // 1: bayesianopt.GetBoSuggestionRequest.observation:type_name -> bayesianopt.BoObservation
	3,  // 2: bayesianopt.GetBoSuggestionResponse.suggestion:type_name -> bayesianopt.BoSuggestion
	0,  // 3: bayesianopt.ShrinkInputDomainRequest.interval:type_name -> bayesianopt.IntInterval
	1,  // 4: bayesianopt.BayesianOptimizerService.CreateBoModel:input_type -> bayesianopt.BoModelInitData
	5,  // 5: bayesianopt.BayesianOptimizerService.GetBoSuggestion:input_type -> bayesianopt.GetBoSuggestionRequest
	7,  // 6: bayesianopt.BayesianOptimizerService.InferY:input_type -> bayesianopt.InferYRequest
	9,  // 7: bayesianopt.BayesianOptimizerService.ShrinkInputDomain:input_type -> bayesianopt.ShrinkInputDomainRequest
	2,  // 8: bayesianopt.BayesianOptimizerService.DeleteBoModel:input_type -> bayesianopt.BoModelId
	2,  // 9: bayesianopt.BayesianOptimizerService.CreateBoModel:output_type -> bayesianopt.BoModelId
	6,  // 10: bayesianopt.BayesianOptimizerService.GetBoSuggestion:output_type -> bayesianopt.GetBoSuggestionResponse
	8,  // 11: bayesianopt.BayesianOptimizerService.InferY:output_type -> bayesianopt.InferYResponse
	10, // 12: bayesianopt.BayesianOptimizerService.ShrinkInputDomain:output_type -> bayesianopt.ShrinkInputDomainResponse
	2,  // 13: bayesianopt.BayesianOptimizerService.DeleteBoModel:output_type -> bayesianopt.BoModelId
	9,  // [9:14] is the sub-list for method output_type
	4,  // [4:9] is the sub-list for method input_type
	4,  // [4:4] is the sub-list for extension type_name
	4,  // [4:4] is the sub-list for extension extendee
	0,  // [0:4] is the sub-list for field type_name
}

func init() { file_pkg_bayesianopt_bayesian_optimizer_proto_init() }
func file_pkg_bayesianopt_bayesian_optimizer_proto_init() {
	if File_pkg_bayesianopt_bayesian_optimizer_proto != nil {
		return
	}
	if !protoimpl.UnsafeEnabled {
		file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[0].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*IntInterval); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[1].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*BoModelInitData); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[2].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*BoModelId); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[3].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*BoSuggestion); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[4].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*BoObservation); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[5].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*GetBoSuggestionRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[6].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*GetBoSuggestionResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[7].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*InferYRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[8].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*InferYResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[9].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*ShrinkInputDomainRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[10].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*ShrinkInputDomainResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
	}
	file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[1].OneofWrappers = []interface{}{}
	file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[5].OneofWrappers = []interface{}{}
	file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes[9].OneofWrappers = []interface{}{}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_pkg_bayesianopt_bayesian_optimizer_proto_rawDesc,
			NumEnums:      0,
			NumMessages:   11,
			NumExtensions: 0,
			NumServices:   1,
		},
		GoTypes:           file_pkg_bayesianopt_bayesian_optimizer_proto_goTypes,
		DependencyIndexes: file_pkg_bayesianopt_bayesian_optimizer_proto_depIdxs,
		MessageInfos:      file_pkg_bayesianopt_bayesian_optimizer_proto_msgTypes,
	}.Build()
	File_pkg_bayesianopt_bayesian_optimizer_proto = out.File
	file_pkg_bayesianopt_bayesian_optimizer_proto_rawDesc = nil
	file_pkg_bayesianopt_bayesian_optimizer_proto_goTypes = nil
	file_pkg_bayesianopt_bayesian_optimizer_proto_depIdxs = nil
}
