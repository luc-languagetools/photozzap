from pyramid.response import Response
from pyramid.view import view_config
import logging
import os
import stat
import time
import shutil
import datetime
import time
import tempfile
import subprocess
import transaction

from hashlib import sha1
from random import random

import photozzap.staticresources

from sqlalchemy.exc import DBAPIError, IntegrityError

from .models import (
    DBSession,
    User,
    Conference,
    )

log = logging.getLogger(__name__)    

@view_config(route_name='home', renderer='templates/home.pt')
def home(request):
    settings = request.registry.settings
    tracking_id = settings['analytics_tracking_id'] 
    firebase = settings['firebase']
    www_port = settings['www_port']    
    server_name = settings['server_name']
    default_server_name = settings['default_server_name']
    icon_path = settings['icon_path']
    
    new_conf_url = request.route_url('conference', _host=default_server_name + ".photozzap.com", _port=www_port) + "#/new-conference-template"
    
    permanent_conf_url = request.route_url('conference', _host=server_name + ".photozzap.com", _port=www_port) + "#/new-conference-template"
    
    javascript_files_abs = get_file_list_abs(request, photozzap.staticresources.home_javascript_files)
    css_files_abs = get_file_list_abs(request, photozzap.staticresources.home_css_files)
    
    return {'javascript_files': javascript_files_abs,
            'css_files': css_files_abs,
            'tracking_id': tracking_id,
            'firebase': firebase,
            'server_name': server_name,
            'new_conf_url': new_conf_url,
            'permanent_conf_url': permanent_conf_url,
            'icon_path': icon_path}
    
    
def get_file_list_abs(request, files):
    # build absolute paths for static resource files
    files_abs = [request.static_url('photozzap:' + file) for file in files]
    
    return files_abs

def get_icon_file_list_abs(request):
    icon_files_abs = {}
    for key, file in photozzap.staticresources.icon_files.items():
        icon_files_abs[key] = request.static_url('photozzap:' + file)
        
    return icon_files_abs

def get_cdn_path(cdn_server, file_path):
    return "http://" + cdn_server + "/" + file_path.split('/')[-1]
    
@view_config(route_name='conference', renderer='templates/conference.pt')
def conference(request):

    settings = request.registry.settings
    tracking_id = settings['analytics_tracking_id']
    firebase = settings['firebase']
    server_name = settings['server_name']
    icon_path = settings['icon_path']
        
    javascript_files_abs = get_file_list_abs(request, photozzap.staticresources.conference_javascript_files)
    css_files_abs = get_file_list_abs(request, photozzap.staticresources.conference_css_files)

    params = {'javascript_files': javascript_files_abs,
              'css_files': css_files_abs,
              'tracking_id': tracking_id,
              'firebase': firebase,
              'server_name': server_name,
              'icon_path': icon_path}
                  
    return params

