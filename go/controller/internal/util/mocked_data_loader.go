package util

import (
	"fmt"
	"os"
	"strings"

	"polaris-slo-cloud.github.io/chunk-func/common/pkg/function"
	"polaris-slo-cloud.github.io/chunk-func/common/pkg/yaml"
	chunkFunc "polaris-slo-cloud.github.io/chunk-func/controller/api/v1"
)

// Loads all YAML files in the specified directory and returns the mocked results as a map indexed by "namespace.name" of Knative services.
func LoadMockedProfilingResults(directory string) (map[string]*function.ProfilingSessionResults, error) {
	filePaths, err := findYamlFiles(directory)
	if err != nil {
		return nil, err
	}
	if len(filePaths) == 0 {
		return nil, fmt.Errorf("the directory %s does not contain any YAML files", directory)
	}

	mockedResults := make(map[string]*function.ProfilingSessionResults, len(filePaths))
	for _, yamlPath := range filePaths {
		fnDesc := &chunkFunc.FunctionDescription{}
		if err := yaml.ParseYamlFile(yamlPath, fnDesc); err != nil {
			return nil, fmt.Errorf("error loading YAML file %s: %v", yamlPath, err)
		}
		if fnDesc.Status.ProfilingResults == nil {
			return nil, fmt.Errorf("YAML file %s does not contain any ProfilingResults in the Status object", yamlPath)
		}
		key := fmt.Sprintf("%s.%s", fnDesc.Namespace, fnDesc.Name)
		mockedResults[key] = fnDesc.Status.ProfilingResults
	}

	return mockedResults, nil
}

func findYamlFiles(dir string) ([]string, error) {
	dirEntries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	filePaths := make([]string, 0)
	for _, entry := range dirEntries {
		if !entry.IsDir() {
			filename := strings.ToLower(entry.Name())
			if strings.HasSuffix(filename, ".yaml") {
				filePaths = append(filePaths, dir+"/"+entry.Name())
			}
		}
	}
	return filePaths, nil
}
