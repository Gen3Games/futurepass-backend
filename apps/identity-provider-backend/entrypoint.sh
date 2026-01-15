#!/bin/sh
set -eo

# enable 'http' scheme redirect_uri for non-production environments.
# node-oidc-provider requires these redirect_uris be 'https' only without an
# option to disable this behaviour, hence we reach for drastic measures.
case "$OIDC_HOSTNAME" in
https://login.futureverse.cloud | https://login.futureverse.dev | https://login.futureverse.kiwi | https://login.futureverse.red | https://login.passonline.dev | https://login.passonline.cloud)
  (
    cd node_modules/oidc-provider/lib/helpers
    awk '
  /implicit-force-https/ {print "//" $0; next}
  /implicit-forbid-localhost/ {print "//" $0; next}
  /.*/ {print $0}
' client_schema.js >client_schema.js.tmp
    mv client_schema.js.tmp client_schema.js
  )
  ;;
esac


# why do we need this:
# passport-instagram provides an instagram oauth strategy but it is out of data which does not work with the latest version of 
# instagram auth api. Here is the disscussion https://github.com/jaredhanson/passport-instagram/issues/22
# we need the following script to update the package
# instagram lib path

# instagram is not required for upcoming release so disabling following commands.
# uncomment once we support instagram login.
# TAG:IG_SUPPORT

# target_file="./node_modules/passport-instagram/lib/strategy.js"


# replace instagram api url
# sed -i 's#https://api.instagram.com/v1/users/self#https://graph.instagram.com/me?fields=id,username#g' "$target_file"

# replace how to set profile.id
# sed -i 's#profile.id = json.data.id#profile.id = json.id#g' "$target_file"

# replace how to set profile.displayName
# sed -i 's#profile.displayName = json.data.full_name;##g' "$target_file"

# replace how to set profile.name
# sed -i 's#profile.name = { familyName: json.data.last_name,##g' "$target_file"
# sed -i 's#givenName: json.data.first_name };##g' "$target_file"

# replace how to set profile.username
# sed -i 's#profile.username = json.data.username#profile.username = json.username#g' "$target_file"

# echo "successfully updated the script"


# launch the *actual* entrypoint, likely the OIDC server.
"$@"
