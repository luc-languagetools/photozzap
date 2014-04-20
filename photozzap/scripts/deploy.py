import sys
import photozzap.scripts.deploy_static_assets
import subprocess

from pyramid.paster import (
    get_appsettings,
    setup_logging,
    )

def git_commit(server_name):
    # git add photozzap/static/nodejs/*
    # git add photozzap/static/cdn-files/*
    # git commit -a -m 'initial import of cdn-files and nodejs'
    # git tag -a v1.4 -m 'my version 1.4'
    # git push origin --tags
    
    subprocess.check_call("git add photozzap/static/nodejs/*", shell=True)
    subprocess.check_call("git add photozzap/static/nodejs/*", shell=True)
    commit_cmd_line = "git commit -a -m 'generated assets for " + server_name + "'"
    subprocess.check_call(commit_cmd_line, shell=True)
    tag_cmd_line = "git tag -a v" + server_name + " -m 'deployed version " + server_name + "'"
    subprocess.check_call(tag_cmd_line, shell=True)
    
    
if __name__ == "__main__":
    argv = sys.argv
    if len(argv) != 3:
        print("incorrect parameters")
        sys.exit(1)
    config_uri = argv[1]
    server_name = argv[2]
    settings = get_appsettings(config_uri)
    settings['server_name'] = server_name
    
    photozzap.scripts.deploy_static_assets.manage_assets(settings)
    git_commit(server_name)