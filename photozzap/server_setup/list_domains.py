#!/usr/bin/env python

import os
import sys
import pyrax
import time

def set_credentials():
    pyrax.set_setting("identity_type", "rackspace")
    creds_file = os.path.expanduser("~/.rackspace_cloud_credentials")
    pyrax.set_credential_file(creds_file)

def find_record(default_server_name):
    # add CNAME record
    domain_name = "photozzap.com"
    dns = pyrax.cloud_dns
    dom = dns.find(name=domain_name)    
    
    default_server_record = dom.find_record('CNAME', name=default_server_name + "." + domain_name)
    print("deleting: default server record")
    default_server_record.delete();
    
    record = {"type": "CNAME",
            "name": default_server_record + "." + domain_name,
            "data": "f276f02b6d774df70e78-300dfe14c808e5a28b9c54ba17b313d1.r29.cf1.rackcdn.com",
            "ttl": 300}    
            
    recs = dom.add_records([record])
    print recs    

if __name__ == "__main__":
    set_credentials()
    find_record("test-www")
