#!/bin/sh

configure_file="apps/identity-provider-backend/docker-compose.yaml"

if [ "$#" -eq  "0" ]
then
    echo "No configuration file provided, use the default"
else
    configure_file=$1
fi

if command -v docker-compose >/dev/null 2>&1 || command -v docker compose >/dev/null 2>&1; then
    if command -v docker-compose >/dev/null 2>&1; then
        docker-compose -f "$configure_file" up -d
    else
        docker compose -f "$configure_file" up -d
    fi
    
    # Run additional commands
    apps/identity-provider-backend/oidc-dev.sh
    pnpm exec nx build identity-provider-frontend --configuration=development
    pnpm exec nx serve identity-provider-backend
else
    echo "Please install Docker and Docker Compose first."
fi
