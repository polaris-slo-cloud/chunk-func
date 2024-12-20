# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# source: bayesian_optimizer.proto
# Protobuf Python Version: 4.25.0
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()




DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x18\x62\x61yesian_optimizer.proto\x12\x0b\x62\x61yesianopt\"5\n\x0bIntInterval\x12\x12\n\nlowerBound\x18\x01 \x01(\x04\x12\x12\n\nupperBound\x18\x02 \x01(\x04\"\xb9\x01\n\x0f\x42oModelInitData\x12\x17\n\x0fpossibleXValues\x18\x01 \x03(\x04\x12/\n\x08interval\x18\x02 \x01(\x0b\x32\x18.bayesianopt.IntIntervalH\x00\x88\x01\x01\x12\x12\n\x05kappa\x18\x03 \x01(\x01H\x01\x88\x01\x01\x12\x0f\n\x02xi\x18\x04 \x01(\x01H\x02\x88\x01\x01\x12\x19\n\x11maxSamplesPercent\x18\x05 \x01(\x01\x42\x0b\n\t_intervalB\x08\n\x06_kappaB\x05\n\x03_xi\"\x1c\n\tBoModelId\x12\x0f\n\x07modelId\x18\x01 \x01(\t\"A\n\x0c\x42oSuggestion\x12\t\n\x01x\x18\x01 \x01(\x04\x12\x0b\n\x03poi\x18\x02 \x01(\x01\x12\x19\n\x11percentageSampled\x18\x03 \x01(\x01\"/\n\rBoObservation\x12\t\n\x01x\x18\x01 \x01(\x04\x12\x13\n\x0bobservation\x18\x02 \x01(\x01\"o\n\x16GetBoSuggestionRequest\x12\x0f\n\x07modelId\x18\x01 \x01(\t\x12\x34\n\x0bobservation\x18\x02 \x01(\x0b\x32\x1a.bayesianopt.BoObservationH\x00\x88\x01\x01\x42\x0e\n\x0c_observation\"Y\n\x17GetBoSuggestionResponse\x12\x0f\n\x07modelId\x18\x01 \x01(\t\x12-\n\nsuggestion\x18\x02 \x01(\x0b\x32\x19.bayesianopt.BoSuggestion\"+\n\rInferYRequest\x12\x0f\n\x07modelId\x18\x01 \x01(\t\x12\t\n\x01x\x18\x02 \x01(\x04\"7\n\x0eInferYResponse\x12\x0f\n\x07modelId\x18\x01 \x01(\t\x12\t\n\x01x\x18\x02 \x01(\x04\x12\t\n\x01y\x18\x03 \x01(\x01\"\x82\x01\n\x18ShrinkInputDomainRequest\x12\x0f\n\x07modelId\x18\x01 \x01(\t\x12\x17\n\x0fpossibleXValues\x18\x02 \x03(\x04\x12/\n\x08interval\x18\x03 \x01(\x0b\x32\x18.bayesianopt.IntIntervalH\x00\x88\x01\x01\x42\x0b\n\t_interval\"K\n\x19ShrinkInputDomainResponse\x12\x0f\n\x07modelId\x18\x01 \x01(\t\x12\x1d\n\x15remainingXValuesCount\x18\x02 \x01(\x04\x32\xb1\x03\n\x18\x42\x61yesianOptimizerService\x12G\n\rCreateBoModel\x12\x1c.bayesianopt.BoModelInitData\x1a\x16.bayesianopt.BoModelId\"\x00\x12^\n\x0fGetBoSuggestion\x12#.bayesianopt.GetBoSuggestionRequest\x1a$.bayesianopt.GetBoSuggestionResponse\"\x00\x12\x43\n\x06InferY\x12\x1a.bayesianopt.InferYRequest\x1a\x1b.bayesianopt.InferYResponse\"\x00\x12\x64\n\x11ShrinkInputDomain\x12%.bayesianopt.ShrinkInputDomainRequest\x1a&.bayesianopt.ShrinkInputDomainResponse\"\x00\x12\x41\n\rDeleteBoModel\x12\x16.bayesianopt.BoModelId\x1a\x16.bayesianopt.BoModelId\"\x00\x42\x41Z?polaris-slo-cloud.github.io/chunk-func/profiler/pkg/bayesianoptb\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'bayesian_optimizer_pb2', _globals)
if _descriptor._USE_C_DESCRIPTORS == False:
  _globals['DESCRIPTOR']._options = None
  _globals['DESCRIPTOR']._serialized_options = b'Z?polaris-slo-cloud.github.io/chunk-func/profiler/pkg/bayesianopt'
  _globals['_INTINTERVAL']._serialized_start=41
  _globals['_INTINTERVAL']._serialized_end=94
  _globals['_BOMODELINITDATA']._serialized_start=97
  _globals['_BOMODELINITDATA']._serialized_end=282
  _globals['_BOMODELID']._serialized_start=284
  _globals['_BOMODELID']._serialized_end=312
  _globals['_BOSUGGESTION']._serialized_start=314
  _globals['_BOSUGGESTION']._serialized_end=379
  _globals['_BOOBSERVATION']._serialized_start=381
  _globals['_BOOBSERVATION']._serialized_end=428
  _globals['_GETBOSUGGESTIONREQUEST']._serialized_start=430
  _globals['_GETBOSUGGESTIONREQUEST']._serialized_end=541
  _globals['_GETBOSUGGESTIONRESPONSE']._serialized_start=543
  _globals['_GETBOSUGGESTIONRESPONSE']._serialized_end=632
  _globals['_INFERYREQUEST']._serialized_start=634
  _globals['_INFERYREQUEST']._serialized_end=677
  _globals['_INFERYRESPONSE']._serialized_start=679
  _globals['_INFERYRESPONSE']._serialized_end=734
  _globals['_SHRINKINPUTDOMAINREQUEST']._serialized_start=737
  _globals['_SHRINKINPUTDOMAINREQUEST']._serialized_end=867
  _globals['_SHRINKINPUTDOMAINRESPONSE']._serialized_start=869
  _globals['_SHRINKINPUTDOMAINRESPONSE']._serialized_end=944
  _globals['_BAYESIANOPTIMIZERSERVICE']._serialized_start=947
  _globals['_BAYESIANOPTIMIZERSERVICE']._serialized_end=1380
# @@protoc_insertion_point(module_scope)
