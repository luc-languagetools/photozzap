import sys
import photozzap.scripts.deploy_static_assets
import subprocess

from pyramid.paster import (
    get_appsettings,
    setup_logging,
    )

def shutdown_node(server_name, deploy_server_name):
    # ssh root@deploy_server "stop node NAME=server_name"
    # ssh root@deploy_server "rm /etc/node/server_name.conf"

    try:
        shutdown_node_cmd_line = 'ssh root@' + deploy_server_name + ' "stop node NAME=' + server_name + '"'
        subprocess.check_call(shutdown_node_cmd_line, shell=True)
    except:
        print("Unexpected error:", sys.exc_info()[0])
    
    remove_upstart_entry_cmd_line = 'ssh root@' + deploy_server_name + ' "rm -f /etc/node/' + server_name + '.conf"'
    subprocess.check_call(remove_upstart_entry_cmd_line, shell=True)
    
    

def delete_cdn(server_name):
    upload_cmd_line = "python2.7 delete_cdn.py " + server_name
    subprocess.check_call(upload_cmd_line, shell=True, cwd="photozzap/server_setup")
    
if __name__ == "__main__":
    argv = sys.argv
    if len(argv) != 3:
        print("incorrect parameters")
        sys.exit(1)
    config_uri = argv[1]
    server_name = argv[2]
    settings = get_appsettings(config_uri)
    settings['server_name'] = server_name
    deploy_server_name = settings['deploy_server_name']
    
    shutdown_node(server_name, deploy_server_name)
    delete_cdn(server_name)