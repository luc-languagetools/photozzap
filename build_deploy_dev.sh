export ENVIRONMENT=dev
rm -rf dist && rm -rf angular_config_generated && gulp build && surge -p ./dist/ -d d.zzap.co