
import os
import sys
import pyrax
import time

def set_credentials():
    pyrax.set_setting("identity_type", "rackspace")
    creds_file = os.path.expanduser("~/.rackspace_cloud_credentials")
    pyrax.set_credential_file(creds_file)

def upload_files():
    argv = sys.argv
    cont_name = argv[1]
    files =  argv[2:]

    set_credentials()
    cf = pyrax.cloudfiles
    cont = cf.get_container(cont_name)
    
    epoch = int(time.mktime(time.gmtime()))
    
    for file in files:
        obj = cf.upload_file(cont, file, content_type="image/jpg")
        obj.delete_in_seconds(86400 * 14) # delete after 14 days
    


if __name__ == "__main__":
    upload_files()
