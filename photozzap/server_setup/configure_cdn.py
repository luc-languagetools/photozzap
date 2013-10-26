#!/usr/bin/env python

import os
import sys
import pyrax
import time

def set_credentials():
    pyrax.set_setting("identity_type", "rackspace")
    creds_file = os.path.expanduser("~/.rackspace_cloud_credentials")
    pyrax.set_credential_file(creds_file)

def create_cdn_container(server_name):
    cf = pyrax.cloudfiles

    cont_name = server_name
    cont = cf.create_container(cont_name)

    # Make it public
    cont.make_public(ttl=1209600) # 2 weeks

    # Now re-check the container's attributes
    cont = cf.get_container(cont_name)
    print("After Making Public")
    print("cdn_enabled", cont.cdn_enabled)
    print("cdn_ttl", cont.cdn_ttl)
    print("cdn_log_retention", cont.cdn_log_retention)
    print("cdn_uri", cont.cdn_uri)
    print("cdn_ssl_uri", cont.cdn_ssl_uri)
    print("cdn_streaming_uri", cont.cdn_streaming_uri)
    print("cdn_ios_uri", cont.cdn_ios_uri)
    
    # add CNAME record
    domain_name = "photozzap.com"
    dns = pyrax.cloud_dns
    dom = dns.find(name=domain_name)    
    
    target_domain = cont.cdn_uri.replace('http://', '')
    
    record = {"type": "CNAME",
            "name": cont_name + "." + domain_name,
            "data": target_domain,
            "ttl": 6000}    
            
    recs = dom.add_records([record])
    print recs            
    
    upload_files(cont)


def upload_files(cont):
    cf = pyrax.cloudfiles
    sys.path.append('../')
    import staticresources
    # upload all required resources
    for file in staticresources.cdn_asset_list:
        full_path = '../' + file
        content_type = None
        if full_path.endswith('.js'):
            content_type = "application/javascript"
        elif full_path.endswith('.css'):
            content_type = "text/css"
        elif full_path.endswith('.png'):
            content_type = "image/png"
        print("uploading %s as %s" %(full_path, content_type))
        cf.upload_file(cont, full_path, content_type=content_type)
    
    
if __name__ == "__main__":
    set_credentials()
    create_cdn_container("photozzap-dev-test7")
