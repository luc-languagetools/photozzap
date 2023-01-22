photozzap README

Overview
--------
This project was a realtime photosharing / conferencing web app. Started out using ejabberd/XMPP as backend (deployed using rackspace cloud), jquery based frontend, later converted to an Angular SPA using Firebase Realtime Database. Code is not expected to work as is, for reference only.

deploy a version
--------------------------

# deploy in TEST environment
../bin/python -m photozzap.scripts.deploy test-vps.ini test-20140506-1
# shutdown in TEST environment 
 ../bin/python -m photozzap.scripts.shutdown test-vps.ini test-20140420-1
 
# deploy in PROD environment
../bin/python -m photozzap.scripts.deploy prod-vps.ini www-08
# shutdown in TEST environment (MAKE SURE TO LIST OPEN CONFERENCES FIRST)
../bin/python -m photozzap.scripts.shutdown prod-vps.ini www-01
  



git help
--------

branching
#create new branch (usually create off of develop branch)
git checkout -b 20140506-feature-1 develop

