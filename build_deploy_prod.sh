export ENVIRONMENT=prod
rm -rf dist && rm -rf angular_config_generated && gulp build && surge -p ./dist/ -d p.zzap.co