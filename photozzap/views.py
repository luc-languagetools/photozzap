from pyramid.response import Response
from pyramid.view import view_config
import logging
import os
import stat
import shutil
import datetime
import tempfile
import subprocess
import transaction


from sqlalchemy.exc import DBAPIError, IntegrityError

from .models import (
    DBSession,
    User,
    Conference,
    )

log = logging.getLogger(__name__)    

def photo_storage_path_relative(request):
    settings = request.registry.settings
    photo_static_path_relative = settings['photo_static_path_relative']
    date_path_relative = os.path.join(photo_static_path_relative, datetime.date.today().strftime("%Y/%m/%d"))
    return date_path_relative

def photo_storage_path_base(request):
    settings = request.registry.settings
    photo_static_path_base = settings['photo_static_path_base']
    return photo_static_path_base

def resize_image(request, path_base, dir, photo_id, original_path, geometry, quality):

    resized_filename = photo_id + "_" + geometry + ".JPG"
    resized_abs_path = os.path.join(dir, resized_filename)
    resized_rel_path = os.path.relpath(resized_abs_path, path_base)
    
    command = "convert -quality " + quality + " -geometry " + geometry + " " + original_path + " " + resized_abs_path
    subprocess.call(command, shell=True)
    
    full_image_url = request.static_url('photozzap:' + resized_rel_path)
    return full_image_url
    
@view_config(route_name='upload_photo',renderer='json')
def upload_photo(request):
    log.debug(request.POST)
    filename = request.POST.get('name')
    input_file = request.POST.get('file').file

    path_relative = photo_storage_path_relative(request)
    path_base = photo_storage_path_base(request)
    
    dir = os.path.join(path_base, path_relative)
    os.makedirs(dir,exist_ok=True)

    output_file_handle = tempfile.NamedTemporaryFile(suffix='.JPG',dir=dir,delete=False)
    output_file_abs_path = output_file_handle.name
    output_file_rel_path = os.path.relpath(output_file_abs_path, path_base)
    photo_id = os.path.basename(output_file_abs_path).split(".")[0]
    
    log.debug("output_file_abs_path: " + output_file_abs_path)
    
    # save photo
    shutil.copyfileobj(input_file, output_file_handle)
    output_file_handle.close()   
    st = os.stat(output_file_abs_path)
    os.chmod(output_file_abs_path, st.st_mode | stat.S_IROTH)
    
    # obtain image dimensions
    size_command = "identify -format \"%[fx:w]x%[fx:h]\" " + output_file_abs_path
    size_info = subprocess.check_output(size_command, shell=True).decode("utf-8").strip()
    log.debug("size_info: " + size_info);
    size_components = size_info.split("x")
    width = size_components[0]
    height = size_components[1]    
    
    # create thumbnail
    thumbnail_filename = photo_id + "_small.JPG"
    thumbnail_abs_path = os.path.join(dir, thumbnail_filename)
    thumbnail_rel_path = os.path.relpath(thumbnail_abs_path, path_base)

    # convert thumbnails to square
    command = "convert -quality 88 " + output_file_abs_path + " -thumbnail 400x300^ -gravity center -extent 400x300 " + thumbnail_abs_path
    subprocess.call(command, shell=True)
    
    # resize others
    resized_512x512_url = resize_image(request, path_base, dir, photo_id, output_file_abs_path, "512x512", "35")
    resized_800x800_url = resize_image(request, path_base, dir, photo_id, output_file_abs_path, "900x900", "85")
    
    # create urls
    full_image_url = request.static_url('photozzap:' + output_file_rel_path)
    thumbnail_url = request.static_url('photozzap:' + thumbnail_rel_path)
    
    return {'urls': [resized_512x512_url,
                     resized_800x800_url,
                     full_image_url], 'thumbnail':thumbnail_url, 'id': photo_id, 'width': width, 'height': height}
    

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
    return {'new_conf_url': request.route_url('new_conference')}
    
@view_config(route_name='conference', renderer='templates/conference.pt')
def conference(request):

    settings = request.registry.settings
    jabber_server = settings['jabber_server']
    jabber_conf_server = settings['jabber_conf_server']
    bosh_service = settings['bosh_service']
    
    conf_key = request.matchdict['conf_key']
    conf = DBSession.query(Conference).filter_by(secret=conf_key).one()

    # create new user
    user_created = False
    
    params = {'bosh_service': bosh_service,
              'conference': conf.name + '@' + jabber_conf_server}
    while user_created == False:
        try:
            with transaction.manager:
                user = User()
                DBSession.add(user)
                params['login'] = user.login + '@' + jabber_server
                params['password'] = user.password
            user_created = True
        except IntegrityError:
            # user already exists, will retry
            user_created = False

                  
    return params

