# helper script loads the dashboard with the latest libraries

pnpm run build:dev:libs --parallel=10
cd dist/libs || exit

cd react-sdk || exit
r_sdk=$(yalc publish)
r_sdk_version=${r_sdk%*" published in store."}
[ -z "$r_sdk_version" ] && exit

cd ../experience-sdk || exit
e_sdk=$(yalc publish)
yalc push
e_sdk_version=${e_sdk%*" published in store."}
[ -z "$e_sdk_version" ] && exit

cd ../identity-contract-bindings || exit
i_c_b=$(yalc publish)
yalc push
i_c_b_version=${i_c_b%*" published in store."}
[ -z "$i_c_b_version" ] && exit

cd ../oidc-client || exit
o_c=$(yalc publish)
yalc push
o_c_version=${o_c%*" published in store."}
[ -z "$o_c_version" ] && exit

cd ../rpc-kit || exit
rpc_k=$(yalc publish)
yalc push
rpc_k_version=${rpc_k%*" published in store."}
[ -z "$rpc_k_version" ] && exit

cd ../stateboss || exit
s_b=$(yalc publish)
yalc push
s_b_version=${s_b%*" published in store."}
[ -z "$s_b_version" ] && exit

cd ../../../../fv-identity-monorepo/ || exit

rm -rf node_modules/.cache
rm -rf apps/futureverse-identity-dashboard/.next

yalc add $r_sdk_version
yalc add $e_sdk_version
yalc add $i_c_b_version
yalc add $o_c_version
yalc add $rpc_k_version
yalc add $s_b_version

yarn add xrpl-binary-codec-prerelease

yarn dev
