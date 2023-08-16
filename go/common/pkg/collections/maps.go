package collections

// Creates a (shallow) copy of the src map.
func CopyMap[K comparable, V any](src map[K]V) map[K]V {
	dest := make(map[K]V, len(src))
	for key, value := range src {
		dest[key] = value
	}
	return dest
}
