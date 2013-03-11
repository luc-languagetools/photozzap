from pyramid.response import Response
from pyramid.view import view_config
import logging
import os
import shutil
import datetime
import tempfile
import subprocess
import transaction


from sqlalchemy.exc import DBAPIError, IntegrityError

from .models import (
    DBSession,
    User,
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
    
    # create thumbnail
    thumbnail_filename = photo_id + "_small.JPG"
    thumbnail_abs_path = os.path.join(dir, thumbnail_filename)
    thumbnail_rel_path = os.path.relpath(thumbnail_abs_path, path_base)
    command = "convert -geometry 200x150 " + output_file_abs_path + " " + thumbnail_abs_path
    subprocess.call(command, shell=True)
    
    # create urls
    full_image_url = request.static_url('photozzap:' + output_file_rel_path)
    thumbnail_url = request.static_url('photozzap:' + thumbnail_rel_path)
    
    return {'url':full_image_url, 'thumbnail':thumbnail_url, 'id': photo_id}
    


@view_config(route_name='home', renderer='templates/mytemplate.pt')
def my_view(request):
    try:
        one = DBSession.query(MyModel).filter(MyModel.name == 'one').first()
    except DBAPIError:
        return Response(conn_err_msg, content_type='text/plain', status_int=500)
    return {'one': one, 'project': 'photozzap'}

conn_err_msg = """\
Pyramid is having a problem using your SQL database.  The problem
might be caused by one of the following things:

1.  You may need to run the "initialize_photozzap_db" script
    to initialize your database tables.  Check your virtual 
    environment's "bin" directory for this script and try to run it.

2.  Your database server may not be running.  Check that the
    database server referred to by the "sqlalchemy.url" setting in
    your "development.ini" file is running.

After you fix the problem, please restart the Pyramid application to
try it again.
"""

@view_config(route_name='conference', renderer='templates/conference.pt')
def conference(request):

    settings = request.registry.settings
    jabber_server = settings['jabber_server']
    bosh_service = settings['bosh_service']

    # create new user
    user_created = False
    
    params = {'bosh_service': bosh_service}
    while user_created == False:
        try:
            with transaction.manager:
                user = User()
                DBSession.add(user)
                params['login'] = user.login + '@' + jabber_server
                params['password'] = user.password
                params['nickname'] = user.login
            user_created = True
        except IntegrityError:
            # user already exists, will retry
            user_created = False

                  
    return params

