package function

// Returns true if the statusCode indicates a success.
func IsSuccessStatusCode(statusCode int32) bool {
	return statusCode >= 200 && statusCode <= 299
}
