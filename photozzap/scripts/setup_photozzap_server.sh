#!/bin/bash

SHORT_NAME=`cat /etc/photozzap-name`
echo "short name: " $SHORT_NAME

REPLACE_CMD="sed -i s/master-/$SHORT_NAME-/g"

# stop nginx and ejabberd
/etc/init.d/ejabberd stop
/etc/init.d/nginx stop


NGINX_CONFIG=/etc/nginx/sites-enabled/photozzap
$REPLACE_CMD $NGINX_CONFIG

EJABBERD_CONFIG=/etc/ejabberd/ejabberd.cfg
$REPLACE_CMD $EJABBERD_CONFIG

# reset jabber config
rm -f /var/lib/ejabberd/*
rm -f /var/log/ejabberd/*
rm -f /var/run/ejabberd/*

# restart nginx and ejabberd
/etc/init.d/nginx start
/etc/init.d/ejabberd start

# configure photozzap
PHOTOZZAP_CONFIG=/home/prod/env/photozzap/production.ini
rm /home/prod/env/photozzap/photozzap.sqlite
rm -rf /home/prod/env/photozzap/photozzap/static/photo_uploads/*
rm -f /home/prod/env/photozzap/log/*
# configure
cp $PHOTOZZAP_CONFIG $PHOTOZZAP_CONFIG.bak
$REPLACE_CMD $PHOTOZZAP_CONFIG
# initialize DB
sudo -u prod /home/prod/env/bin/initialize_photozzap_db /home/prod/env/photozzap/production.ini
sudo -u prod bash /home/prod/env/photozzap/photozzap/scripts/start_pserve.sh
