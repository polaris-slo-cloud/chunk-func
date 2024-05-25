package util

import (
	"fmt"
	"os"
	"strconv"
)

func GetFloatEnvVar(key string, defaultValue *float64) (float64, error) {
	strValue := os.Getenv(key)
	if strValue == "" {
		if defaultValue != nil {
			return *defaultValue, nil
		} else {
			return 0.0, fmt.Errorf("lease set the %s environment variable to a float value", key)
		}
	}

	floatValue, err := strconv.ParseFloat(strValue, 64)
	if err != nil {
		return 0.0, fmt.Errorf("the %s environment variable is not a proper float value", key)
	}
	return floatValue, nil
}
