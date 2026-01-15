#!/bin/bash
# This script removes the https requirement for the OIDC provider for local dev
echo "Removing"
set -eo pipefail
cd node_modules/oidc-provider/lib/helpers
awk '
  /implicit-force-https/ {print "//" $0; next}
  /implicit-forbid-localhost/ {print "//" $0; next}
  /.*/ {print $0}
' client_schema.js > client_schema.js.tmp
mv client_schema.js.tmp client_schema.js
