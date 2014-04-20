
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

def get_file_name(path):
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
    server_name = settings['server_name']

    new_conf_url = 'conference#/new-conference-template'
    
    home_attributes = {
        'javascript_files': get_file_name(photozzap.staticresources.combined_home_javascript_file),
        'css_files': get_file_name(photozzap.staticresources.combined_home_css_file),
        'tracking_id': tracking_id,
        'firebase': firebase,
        'server_name': server_name,
        'new_conf_url': new_conf_url        
    }
    render_template('photozzap:templates/home.pt', home_attributes, photozzap.staticresources.home_file_path)


def copy_static_files(settings):
    for asset in photozzap.staticresources.other_static_assets:
        resolver = a.resolve(asset)
        file_path = resolver.abspath() 
        
        resolver = a.resolve("static/cdn-files/")
        dir_path = resolver.abspath()
        print("copying " + file_path + " to " + dir_path)
        shutil.copy(file_path, dir_path)
        
    
if __name__ == "__main__":
    argv = sys.argv
    if len(argv) != 2:
        print("incorrect parameters")
        sys.exit(1)
    config_uri = argv[1]
    settings = get_appsettings(config_uri)
    
    config = pyramid.testing.setUp()
    config.include('pyramid_chameleon')    

    concatenate(photozzap.staticresources.conference_javascript_files, photozzap.staticresources.combined_conference_javascript_file)
    concatenate(photozzap.staticresources.conference_css_files, photozzap.staticresources.combined_conference_css_file)
    concatenate(photozzap.staticresources.home_javascript_files, photozzap.staticresources.combined_home_javascript_file)
    concatenate(photozzap.staticresources.home_css_files, photozzap.staticresources.combined_home_css_file)   

    render_templates(settings)
    copy_static_files(settings)
    
    