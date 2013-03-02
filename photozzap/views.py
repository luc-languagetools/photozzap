from pyramid.view import view_config
import logging
import os
import shutil
import datetime
import tempfile
import subprocess
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
    return {'project': 'photozzap'}

    
@view_config(route_name='conference', renderer='templates/conference.pt')
def conference(request):
    if request.matchdict["user"] == 'luc':
        params = {'login': 'luc@photozzap.p1.im', 
                  'password': 'luc', 
                  'nickname': 'luc'}
    elif request.matchdict["user"] == 'guy':
        params = {'login': 'guy@photozzap.p1.im', 
                  'password': 'guy', 
                  'nickname': 'guy'}
    elif request.matchdict["user"] == 'carola':
        params = {'login': 'carola@photozzap.p1.im', 
                  'password': 'carola', 
                  'nickname': 'carola'}                  
    elif request.matchdict["user"] == 'armelle':
        params = {'login': 'armelle@photozzap.p1.im', 
                  'password': 'armelle', 
                  'nickname': 'armelle'}       
                  
    return params