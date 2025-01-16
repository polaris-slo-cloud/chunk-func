#!/bin/bash
# set -x

# Copies the Jupyter output to a destination directory and renames the files to use {large, medium, small} instead of input size numbers.

if [[ "$1" == "" ]]; then
    echo "Copies the Jupyter output to a destination directory and renames the files to use {large, medium, small} instead of input size numbers"
    echo "Usage: ./copy-output.sh <target_dir>"
    exit 1
fi

SRC="./output"
targetDir=$1

if [[ ! -d "$SRC" ]]; then
    echo "Source directory $SRC does not exist"
    exit 1
fi

# The possible filename transformations for the output files.
declare -A NAME_TRANSFORMATIONS
NAME_TRANSFORMATIONS["500.73MB"]="large"
NAME_TRANSFORMATIONS["95.8MB"]="large"
NAME_TRANSFORMATIONS["14.34MB"]="large"
NAME_TRANSFORMATIONS["14.25MB"]="large"
NAME_TRANSFORMATIONS["1.54MB"]="large"
NAME_TRANSFORMATIONS["Homogeneous-1.24MB"]="Homogeneous-large"
NAME_TRANSFORMATIONS["227.85MB"]="medium"
NAME_TRANSFORMATIONS["54.27MB"]="medium"
NAME_TRANSFORMATIONS["6.18MB"]="medium"
NAME_TRANSFORMATIONS["6.16MB"]="medium"
NAME_TRANSFORMATIONS["FaceDet-1.24MB"]="FaceDet-medium"
NAME_TRANSFORMATIONS["1.03MB"]="medium"
NAME_TRANSFORMATIONS["0.82MB"]="medium"
NAME_TRANSFORMATIONS["40.3MB"]="small"
NAME_TRANSFORMATIONS["2.35MB"]="small"
NAME_TRANSFORMATIONS["2.1MB"]="small"
NAME_TRANSFORMATIONS["2.07MB"]="small"
NAME_TRANSFORMATIONS["0.49MB"]="small"
NAME_TRANSFORMATIONS["0.33MB"]="small"

# Copies $1 to the destDir $2 and performs the filename transformation for the destination file.
function copyAndRenameFile() {
    local srcFile=$1
    local destDir=$2
    local filename=$(basename "$srcFile")
    local destFilename=""

    for sizeStr in "${!NAME_TRANSFORMATIONS[@]}"; do
        if [[ "$filename" == *"$sizeStr"* ]]; then
            destFilename=$(echo "$filename" | sed "s/$sizeStr/${NAME_TRANSFORMATIONS[$sizeStr]}/")
            destFilename=$(echo "$destFilename" | sed -e "s/ //g")
            break
        fi
    done

    if [[ "$destFilename" == "" ]]; then
        echo "Error: Could not find a size substring to replace in $srcFile"
        exit 1
    fi

    local destFile="$destDir/$destFilename"
    echo "Copying $srcFile to $destFile"
    cp "$srcFile" "$destFile"
}

# Iterates through the subdirectories of a profile (e.g., aws-bo) folder.
function processProfileDir() {
    local profileDir=$1
    local profile=$(basename "$profileDir")
    local sim=""
    local destDir=""

    echo "Processing $profileDir"

    for simDir in "$profileDir"/*/ ; do
        sim=$(basename "$simDir")
        destDir="$targetDir/$profile/$sim"

        echo "Creating directory $destDir"
        mkdir -p "$destDir"

        for f in "$simDir"/*.svg ; do
            copyAndRenameFile "$f" "$destDir"
        done
    done

}


# Iterate over all "output/<profile>" directories.
for d in "$SRC"/*/ ; do
    processProfileDir "$d"
done
