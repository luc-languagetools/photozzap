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

@view_config(route_name='new_conference',renderer='json')
def new_conference(request):
    conf_created = False
    
    settings = request.registry.settings
    www_server = settings['www_server']
    www_port = settings['www_port']
    
    params = {}
    while conf_created == False:
        try:
            with transaction.manager:
                conf = Conference()
                DBSession.add(conf)
                params['conf_key'] = conf.secret
                params['conf_url'] = request.route_url('conference', conf_key=conf.secret, _host=www_server, _port=www_port)
            conf_created = True
        except IntegrityError:
            # user already exists, will retry
            conf_created = False

    return params

    
    
@view_config(route_name='home', renderer='templates/home.pt')
def home(request):
    settings = request.registry.settings
    tracking_id = settings['analytics_tracking_id'] 
    firebase = settings['firebase']
    www_server = settings['www_server']
    www_port = settings['www_port']    
    
    new_conf_url = request.route_url('conference', conf_key="new-conference-template", _host=www_server, _port=www_port)
    
    return {'new_conf_url': request.route_url('new_conference'),
            'tracking_id': tracking_id,
            'firebase': firebase,
            'new_conf_url': new_conf_url}
    
def sign_request(params, api_key, api_secret):
    params = dict( [ (k,v) for (k,v) in params.items() if v] )
    params["signature"] = api_sign_request(params, api_secret)
    params["api_key"] = api_key
    
    return params
  
def api_sign_request(params_to_sign, api_secret):

    to_sign = "&".join(sorted([(k+"="+(",".join(v) if isinstance(v, list) else str(v))) for k, v in params_to_sign.items() if v]))
    return sha1((to_sign + api_secret).encode('utf-8')).hexdigest()
    
@view_config(route_name='upload_data',renderer='json')
def upload_data(request):
    settings = request.registry.settings
    api_key = settings['cloudinary_api_key']
    api_secret = settings['cloudinary_api_secret']

    params = {'timestamp': str(int(time.time())), 'callback':   request.static_url('photozzap:static/cloudinary/cloudinary_cors.html')}
    
    final_request = sign_request(params, api_key, api_secret)
    #params['api_key'] = api_key
    #params['signature'] = signature

    return final_request

    
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
    assets_on_cdn = settings['assets_on_cdn']
    cdn_server = settings['cdn_server']
    tracking_id = settings['analytics_tracking_id']
    firebase = settings['firebase']
        
    javascript_files_abs = get_file_list_abs(request, photozzap.staticresources.javascript_files)
    css_files_abs = get_file_list_abs(request, photozzap.staticresources.css_files)

    icon_files_abs = get_icon_file_list_abs(request)
    
    if False:
        javascript_files_abs = get_file_list_abs(request, [photozzap.staticresources.combined_javascript_file])
        css_files_abs = get_file_list_abs(request, [photozzap.staticresources.combined_css_file])
    
    # build CDN paths
    if assets_on_cdn == "true":
        javascript_files_abs = [get_cdn_path(cdn_server, photozzap.staticresources.combined_javascript_file)]
        css_files_abs = [get_cdn_path(cdn_server, photozzap.staticresources.combined_css_file)]
        icon_files_abs = {}
        for key, file in photozzap.staticresources.icon_files.items():
            icon_files_abs[key] = get_cdn_path(cdn_server, file)
        
    params = {'javascript_files': javascript_files_abs,
              'css_files': css_files_abs,
              'icon_files': icon_files_abs,
              'tracking_id': tracking_id,
              'firebase': firebase}
                  
    return params

