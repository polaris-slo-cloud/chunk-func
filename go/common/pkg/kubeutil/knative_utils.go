package kubeutil

import (
	knApis "knative.dev/pkg/apis"
	knServing "knative.dev/serving/pkg/apis/serving/v1"
)

// Returns true if the service is ready.
func IsKnativeServiceReady(svc *knServing.Service) bool {
	for _, cond := range svc.Status.Conditions {
		if cond.Type == knApis.ConditionReady {
			return GetKnativeServiceURL(svc) != ""
		}
	}
	return false
}

// Returns the URL of the Knative Service as a string or an empty string, if it does not have a URL yet.
func GetKnativeServiceURL(svc *knServing.Service) string {
	if addr := svc.Status.Address; addr != nil {
		url := addr.URL
		if url != nil {
			return url.String()
		}
	}
	return ""
}
