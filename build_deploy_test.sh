export ENVIRONMENT=test
rm -rf dist && gulp build && surge -p ./dist/ -d t.zzap.co