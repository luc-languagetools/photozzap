export ENVIRONMENT=prod
rm -rf dist && gulp build && surge -p ./dist/ -d p.zzap.co