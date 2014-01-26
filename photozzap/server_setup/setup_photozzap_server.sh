#!/bin/bash

while [ ! -f /etc/photozzap-name ];
do
    echo "photozzap-name not present, sleeping"
    sleep 5
done

# incorporate git command-line
# sudo -u prod bash -c "cd /home/prod/env/photozzap; git pull; git checkout server-setup-1"
# part of the command is now in /etc/photozzap-git-cmd

SHORT_NAME=`cat /etc/photozzap-name`
echo "short name: " $SHORT_NAME

REPLACE_CMD="sed -i s/master-/$SHORT_NAME-/g"

NGINX_CONFIG_SOURCE=/home/dev/prod/photozzap/photozzap/server_setup/prod_configs/photozzap_nginx
NGINX_CONFIG=/etc/nginx/sites-enabled/photozzap
cp $NGINX_CONFIG_SOURCE $NGINX_CONFIG
$REPLACE_CMD $NGINX_CONFIG

EJABBERD_CONFIG_SOURCE=/home/dev/env/photozzap/photozzap/server_setup/prod_configs/ejabberd.cfg
EJABBERD_CONFIG=/etc/ejabberd/ejabberd.cfg
cp $EJABBERD_CONFIG_SOURCE $EJABBERD_CONFIG
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
sudo -u prod cp $PHOTOZZAP_CONFIG $PHOTOZZAP_CONFIG.bak
sudo -u prod $REPLACE_CMD $PHOTOZZAP_CONFIG
# initialize DB
sudo -u prod /home/prod/env/bin/initialize_photozzap_db /home/prod/env/photozzap/production.ini
sudo -u prod bash /home/prod/env/photozzap/photozzap/server_setup/start_pserve.sh
