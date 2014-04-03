
function clone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}


function randomStringFromChars(length, chars) {
    if (! length) {
        length = Math.floor(Math.random() * chars.length);
    }

    var str = '';
    for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}   

function randomString(length) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');
    return randomStringFromChars(length, chars);
}   

function randomNumString(length) {
    var chars = '0123456789'.split('');
    return randomStringFromChars(length, chars);
}   

$(document).ready(function() {

    $.cloudinary.config({ cloud_name: 'photozzap', api_key: '751779366151643'})
    
    $(".cloudinary-fileupload").bind("fileuploaddone", function(e, data) {
        var image = {id: data.result.public_id,
                     width: data.result.width,
                     height: data.result.height};
       
        $(document).trigger('upload_image', image);
    });
    
    $(".cloudinary-fileupload").bind("fileuploadstart", function(e){
       //log("fileuploadstart");
       hide_upload_modal();
       show_progress_bar();
     });    
    
    $(".cloudinary-fileupload").bind('fileuploadprogressall', update_progress_bar);
    
    $(".cloudinary-fileupload").bind('cloudinarydone', function(e){ 
        hide_progress_bar();
    });
    
    $("#upload-cloudinary").on('click', function(){
        //log("starting cloudinary file upload");
        $(".cloudinary-fileupload").fileupload();
    });
    
});