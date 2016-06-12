export ENVIRONMENT=dev
rm -rf dist && gulp build && surge -p ./dist/ -d d.zzap.co