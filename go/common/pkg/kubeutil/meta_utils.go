package kubeutil

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetLabel returns the label with the specified key.
func GetLabel(obj metav1.Object, key string) (string, bool) {
	if labels := obj.GetLabels(); labels != nil {
		value, exists := labels[key]
		return value, exists
	}
	return "", false
}

// GetNamespace returns the namespace of the object, or "default" if the namespace is not set.
func GetNamespace(obj metav1.Object) string {
	if namespace := obj.GetNamespace(); namespace != "" {
		return namespace
	}
	return "default"
}

// GetAnnotation returns the annotation with the specified key.
func GetAnnotation(obj metav1.Object, key string) (string, bool) {
	if annotations := obj.GetAnnotations(); annotations != nil {
		value, exists := annotations[key]
		return value, exists
	}
	return "", false
}

// SetAnnotation sets the annotation indicated by the key to the specified value.
func SetAnnotation(obj metav1.Object, key, value string) {
	annotations := obj.GetAnnotations()
	if annotations == nil {
		annotations = make(map[string]string)
		obj.SetAnnotations(annotations)
	}
	annotations[key] = value
}
