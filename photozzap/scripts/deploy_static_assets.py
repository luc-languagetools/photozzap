
import sys
import shutil
from pyramid.path import AssetResolver
import pyramid.renderers
import pyramid.testing
import photozzap.staticresources

from pyramid.paster import (
    get_appsettings,
    setup_logging,
    )

a = AssetResolver('photozzap')    
    
def concatenate(file_list, output_file):
    texts = []
    for file in file_list:
        resolver = a.resolve(file)
        full_path = resolver.abspath()
        print("opening %s" % full_path)
        resource_text = open(full_path, 'r').read()
        texts.append(resource_text)

    # open output file
    resolver = a.resolve(output_file)
    output_path = resolver.abspath()
  
    output_file = open(output_path, "w")
    output_file.write("\n".join(texts))
    output_file.close()    
    
    print("wrote combined code to %s" % output_path)

def get_file_name(path, server_name):
    return [path.split('/')[-1]]
    
def render_template(template, attributes, output_file):
    output = pyramid.renderers.render(template, attributes)
    resolver = a.resolve(output_file)
    output_path = resolver.abspath()
  
    output_file = open(output_path, "w")
    output_file.write(output)
    output_file.close()    
    
    print("wrote rendered template " + template + " to " + output_path)
    
def render_templates(settings):
    tracking_id = settings['analytics_tracking_id'] 
    firebase = settings['firebase']
    firebase_secret = settings['firebase_secret']
    server_name = settings['server_name']
    default_server_name = settings['default_server_name']
    icon_path = settings['icon_path']
    preloader_path = settings['preloader_path']

    cloudinary_name = settings['cloudinary_name']
    cloudinary_api_key = settings['cloudinary_api_key']
    cloudinary_api_secret = settings['cloudinary_api_secret']
    
    pushover_token = settings['pushover_token']
    pushover_user = settings['pushover_user']
    server_env = settings['server_env']
    
    new_conf_url = 'http://' + default_server_name + ".photozzap.com/" + 'conference.html#/new-conference-template'
    
    permanent_conf_url = 'http://' + server_name + ".photozzap.com/" + 'conference.html#/new-conference-template'
    
    home_attributes = {
        'javascript_files': get_file_name(photozzap.staticresources.combined_home_javascript_file, server_name),
        'css_files': get_file_name(photozzap.staticresources.combined_home_css_file, server_name),
        'tracking_id': tracking_id,
        'firebase': firebase,
        'server_name': server_name,
        'new_conf_url': new_conf_url,
        'permanent_conf_url': permanent_conf_url,
        'icon_path': icon_path,
    }
    render_template('photozzap:templates/home.pt', home_attributes, photozzap.staticresources.home_file_path)
    
    conference_attributes = {
        'javascript_files': get_file_name(photozzap.staticresources.combined_conference_javascript_file, server_name),
        'css_files': get_file_name(photozzap.staticresources.combined_conference_css_file, server_name),
        'tracking_id': tracking_id,
        'firebase': firebase,
        'server_name': server_name,
        'server_env': server_env,
        'icon_path': icon_path,
        'preloader_path': preloader_path,
    }    
    render_template('photozzap:templates/conference.pt', conference_attributes, photozzap.staticresources.conference_file_path)

    
    node_config_attributes = {
        'firebaseRoot': firebase,
        'serverName': server_name,
        'firebaseSecret': firebase_secret,
        'cloudinaryName': cloudinary_name,
        'cloudinaryApiKey': cloudinary_api_key, 
        'cloudinaryApiSecret': cloudinary_api_secret,
        'pushoverToken': pushover_token,
        'pushoverUser': pushover_user,
        'serverEnv': server_env,
        
    }
    render_template('photozzap:templates/nodejs-config.js.pt', node_config_attributes, 
                    "static/nodejs/config-" + server_name + ".js")

def copy_static_files(settings):
    for asset in photozzap.staticresources.other_static_assets:
        resolver = a.resolve(asset)
        file_path = resolver.abspath() 
        
        resolver = a.resolve("static/cdn-files/")
        dir_path = resolver.abspath()
        print("copying " + file_path + " to " + dir_path)
        shutil.copy(file_path, dir_path)

def copy_conference_monitor(settings):
    source_file = "photozzap:nodejs/conference-monitor.js"
    target_file = "photozzap:static/nodejs/conference-monitor-" + settings['server_name'] + ".js"
    resolver = a.resolve(source_file)
    abs_source_file = resolver.abspath()
    resolver = a.resolve(target_file)
    abs_target_file = resolver.abspath()
    print("copying " + abs_source_file + " to " + abs_target_file)
    shutil.copy(abs_source_file, abs_target_file)    
    
        
def manage_assets(settings):
    config = pyramid.testing.setUp()
    config.include('pyramid_chameleon')    

    concatenate(photozzap.staticresources.conference_javascript_files, photozzap.staticresources.combined_conference_javascript_file)
    concatenate(photozzap.staticresources.conference_css_files, photozzap.staticresources.combined_conference_css_file)
    concatenate(photozzap.staticresources.home_javascript_files, photozzap.staticresources.combined_home_javascript_file)
    concatenate(photozzap.staticresources.home_css_files, photozzap.staticresources.combined_home_css_file)   

    render_templates(settings)
    copy_static_files(settings)    
    copy_conference_monitor(settings)
    
if __name__ == "__main__":
    argv = sys.argv
    if len(argv) != 3:
        print("incorrect parameters")
        sys.exit(1)
    config_uri = argv[1]
    server_name = argv[2]
    settings = get_appsettings(config_uri)
    settings['server_name'] = server_name
    
    manage_assets(settings)
    
    
    
