import sys
import photozzap.scripts.deploy_static_assets

from pyramid.paster import (
    get_appsettings,
    setup_logging,
    )

def git_commit():
    # git add photozzap/static/nodejs/*
    # git add photozzap/static/cdn-files/*
    
    
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