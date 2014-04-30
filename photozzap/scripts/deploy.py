import sys
import photozzap.scripts.deploy_static_assets
import subprocess

from pyramid.paster import (
    get_appsettings,
    setup_logging,
    )

def git_commit(server_name, deploy_server_name):
    # git add photozzap/static/nodejs/*
    # git add photozzap/static/cdn-files/*
    # git commit -a -m 'initial import of cdn-files and nodejs'
    # git tag -a v1.4 -m 'my version 1.4'
    # git push origin --tags
    
    subprocess.check_call("git add photozzap/static/nodejs/*", shell=True)
    subprocess.check_call("git add photozzap/static/nodejs/*", shell=True)
    commit_cmd_line = "git commit photozzap/static/* -m 'generated assets for " + server_name + "'"
    subprocess.check_call(commit_cmd_line, shell=True)
    tag_cmd_line = "git tag -a v" + server_name + " -m 'deployed version " + server_name + "'"
    subprocess.check_call(tag_cmd_line, shell=True)
    
    git_push_cmd_line = "git push"
    subprocess.check_call(git_push_cmd_line, shell=True)
    
    git_pull_on_deploy_server_cmd_line = 'ssh prod@' + deploy_server_name + ' "cd photozzap; git pull"'
    subprocess.check_call(git_pull_on_deploy_server_cmd_line, shell=True)
    
    setup_upstart_entry_cmd_line = 'ssh root@' + deploy_server_name + ' "touch /etc/node/' + server_name + '.conf"'
    subprocess.check_call(setup_upstart_entry_cmd_line, shell=True)
    
    start_node_cmd_line = 'ssh root@' + deploy_server_name + ' "start node NAME=' + server_name + '"'
    subprocess.check_call(start_node_cmd_line, shell=True)
    

def upload_to_cdn(server_name):
    upload_cmd_line = "python2.7 configure_cdn.py " + server_name
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
    
    photozzap.scripts.deploy_static_assets.manage_assets(settings)
    git_commit(server_name, deploy_server_name)
    upload_to_cdn(server_name)