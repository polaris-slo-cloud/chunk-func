package collections

// Creates a (shallow) copy of the src map.
func CopyMap[K comparable, V any](src map[K]V) map[K]V {
	dest := make(map[K]V, len(src))
	for key, value := range src {
		dest[key] = value
	}
	return dest
}

// Creates a list of keys in the map.
func GetMapKeys[K comparable, V any](src map[K]V) []K {
	keys := make([]K, len(src))
	i := 0
	for key := range src {
		keys[i] = key
		i++
	}
	return keys
}
