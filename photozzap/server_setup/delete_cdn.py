#!/usr/bin/env python

import os
import sys
import pyrax
import time

def set_credentials():
    pyrax.set_setting("identity_type", "rackspace")
    creds_file = os.path.expanduser("~/.rackspace_cloud_credentials")
    pyrax.set_credential_file(creds_file)

def delete_cdn_container(server_name):
    cf = pyrax.cloudfiles

    cont_name = server_name
    
    cont = cf.get_container(cont_name)
    print("about to delete ", cont)
    retval = cont.delete(del_objects=True)
    print("deletion: ", retval)

    # DNS cleanup
    domain_name = "photozzap.com"
    dns = pyrax.cloud_dns
    dom = dns.find(name=domain_name)    
    
    # delete the server record
    searched_record_name = server_name + "." + domain_name
    default_server_record = dom.find_record('CNAME', name=searched_record_name)
    print("deleting server record")
    retval = default_server_record.delete()
    print("deletion of ", searched_record_name, ": ", retval)
    
    
if __name__ == "__main__":
    set_credentials()
    argv = sys.argv
    if len(argv) != 2:
        print("incorrect parameters")
        sys.exit(1)
    server_name = argv[1]
    delete_cdn_container(server_name)
