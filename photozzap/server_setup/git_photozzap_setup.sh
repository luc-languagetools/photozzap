#!/bin/bash
GIT_CMD_FILE=/etc/photozzap-git-cmd
while [ ! -f $GIT_CMD_FILE ];
do
    echo "$GIT_CMD_FILE not present, sleeping"
    sleep 5
done
GIT_CMD=`cat $GIT_CMD_FILE`
# do the checkout
echo "running command $GIT_CMD"
sudo -u prod bash -c "cd /home/prod/env/photozzap; git fetch --all; $GIT_CMD"
