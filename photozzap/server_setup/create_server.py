#!/usr/bin/env python

import os
import sys
import pyrax
import time

argv = sys.argv
if len(argv) != 4:
    print "not enough arguments"
    sys.exit(1)

# param 1: server name, can be "s15" or "test-1"
# param 2: image, can be "photozzap-master-0716"
# param 3: git command line, can be "git pull origin load-balancing-1; git checkout load-balancing-1"
#                                or "git pull origin master; git checkout master"
#                                or "git fetch; git checkout tags/v0.5" for a tag
   
    

creds_file = os.path.expanduser("~/.rackspace_cloud_credentials")
pyrax.settings.set('identity_type', 'rackspace')
pyrax.set_credential_file(creds_file)
cs = pyrax.cloudservers


# set server name
short_name = argv[1]
server_name = "photozzap-" + short_name

# pick image
image_name = argv[2]
master_image = [img for img in cs.images.list() if img.name == image_name ][0]
print master_image

# pick flavor
flavor_512 = [flavor for flavor in cs.flavors.list() if flavor.ram == 512][0]
print flavor_512

meta = {"photozzap_name": short_name}
files = {"/etc/photozzap-name": short_name + "\n",
         "/etc/photozzap-git-cmd": argv[3] + "\n"} # WARNING: special branch

print("creating server")
server = cs.servers.create(server_name, master_image.id, flavor_512.id, meta=meta, files=files)
print "Name:", server.name
print "ID:", server.id
print "Status:", server.status
print "Admin Password:", server.adminPass
print "Networks:", server.networks

print "adding DNS records"
ip_address = None

# we may need to wait a while before the server has available Networks data
networks = {}
while len(networks) == 0:
    # refresh server data
    time.sleep(10)
    print "refreshing servers list"
    servers = cs.servers.list()
    for server in servers:
        if server.name == server_name:
            networks = server.networks

for public_ip in networks["public"]:
    # Return ipv4 address only
    if '.' in public_ip:
        ip_address = public_ip
        print "IP Address: " + ip_address

domain_name = "photozzap.com"
dns = pyrax.cloud_dns
dom = dns.find(name=domain_name)

rec1 = {"type": "A",
        "name": short_name + "-www." + domain_name,
        "data": ip_address,
        "ttl": 6000}

rec2 = {"type": "A",
        "name": short_name + "-jabber." + domain_name,
        "data": ip_address,
        "ttl": 6000}

rec3 = {"type": "A",
        "name": short_name + "-conference.jabber." + domain_name,
        "data": ip_address,
        "ttl": 6000}
        
recs = dom.add_records([rec1, rec2, rec3])
print recs

print "done"