#!/bin/bash
set -eo pipefail

# This is used to create the KEYSTORE stored in /futureverse-oidc/server for each environment

node <<-EOF
var JWK = require('node-jose').JWK;
var ks = JWK.createKeyStore();
ks.generate('RSA', 2048, {alg: 'RS256', use: 'sig'}).then(function(key) {
  console.log(JSON.stringify(ks.toJSON(true), null, 2));
});
EOF
