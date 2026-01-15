#!/bin/sh

set -eo pipefail

# Ensure that all the tools are installed
for cmd in docker-compose pnpm nx; do
    if ! which $cmd >/dev/null; then
        echo "please install $cmd first "
        exit 1
    fi
done

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "Docker is not running, please start Docker。"
    exit 1
fi

# Export the path of the repo
CURRENT_PATH=$(pwd)
export CURRENT_PATH
echo "current path: ${CURRENT_PATH}"

configure_file="${CURRENT_PATH}/apps/identity-provider-backend/docker-compose.yaml"

# Check if there is a configuration file provided as parameter
if [ "$#" -eq 0 ]; then
    echo "No configuration file provided, use the default"
else
    configure_file=$1
fi

# Install the dependencies always
pnpm install

# Run the identity provider backend configuration script
"${CURRENT_PATH}/apps/identity-provider-backend/oidc-dev.sh"

# Build the source code since they are mounted to the docker container
pnpm exec nx run-many --target=build --projects=identity-provider-frontend,identity-provider-backend --configuration=development --watch > /dev/null &

# Start the docker container
docker-compose -f "$configure_file" up

exit 0
