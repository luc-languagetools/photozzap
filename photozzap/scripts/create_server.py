#!/usr/bin/env python

import os
import pyrax
import time

creds_file = os.path.expanduser("~/.rackspace_cloud_credentials")
pyrax.settings.set('identity_type', 'rackspace')
pyrax.set_credential_file(creds_file)
cs = pyrax.cloudservers

# set server name
short_name = "s7"
server_name = "photozzap-" + short_name

# pick image
image_name = "photozzap-master"
master_image = [img for img in cs.images.list() if img.name == image_name ][0]
print master_image

# pick flavor
flavor_512 = [flavor for flavor in cs.flavors.list() if flavor.ram == 512][0]
print flavor_512

meta = {"photozzap_name": short_name}
files = {"/etc/photozzap-name": short_name + "\n"}

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