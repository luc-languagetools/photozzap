export ENVIRONMENT=test
rm -rf dist && rm -rf angular_config_generated && gulp build && surge -p ./dist/ -d t.zzap.co