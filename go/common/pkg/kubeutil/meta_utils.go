package kubeutil

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"polaris-slo-cloud.github.io/chunk-func/common/pkg/collections"
)

const (
	// The pod label, where the ResourceProfile.ID is stored.
	ResourceProfileLabel = "polaris-slo-cloud.github.io/chunk-func.resource-profile"
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

// Creates a deep copy of an ObjectMeta that can be used for creating a new object.
// The copy process omits the namespace and name fields, as well as fields, which are
// later set by Kubernetes.
func DeepCopyObjectMetaForNewObject(src *metav1.ObjectMeta) *metav1.ObjectMeta {
	dest := &metav1.ObjectMeta{
		Labels:      collections.CopyMap(src.Labels),
		Annotations: collections.CopyMap(src.Annotations),
	}
	return dest
}
