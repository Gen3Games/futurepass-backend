#!/bin/bash

# why do we need this ?

# we are using @nx/rollup plugin to build and bundle the libraries. 
# but for commonjs module, the plugin always generates the entry file and name it to "index.cjs.js"
# for esm module, the plugin always generates the entry file and name it to "index.ems.js"
# those entry file names are not suitable for our system because of 2 reasons that
# 1, we want the commonjs module files are using ".cjs" as their extension
# 2, when building multi-entry packages, this naming convention doesn't work

# So we need to customize the entry file names and chunk file names
# for commonjs module, we use the name patter [file name].c.cjs
# for esm module, we use the name patter [file name].e.js

# However, the @nx/rollup hardcoded the entry file names and put them into the generated package.json
# So, we need to this script to update the entry file names in generated package.json

# To run this script, install the "jq" first
# homebrew install jq 
 
# check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "jq is not installed. Please install jq to proceed."
    exit 1
fi

# check if package.json is provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path_to_package.json>"
    exit 1
fi

# get package.json file path
FILE=$1

# check if package.json exists
if [ ! -f "$FILE" ]; then
    echo "File not found: $FILE"
    exit 1
fi

# update "main" and "module" fields using jq
jq '.main = "./index.c.cjs" | .module = "./index.e.js"' $FILE > temp.json && mv temp.json $FILE

echo "$FILE has been updated."
