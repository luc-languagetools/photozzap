function setup_uploader() {    
    var uploader = new plupload.Uploader({
        runtimes : 'html5',
        browse_button : 'pickfiles',
        //container : 'container',
        max_file_size : '10mb',
        url : '/upload_photo',
        drop_element : 'dragdrop_area',
        filters : [
            {title : "Image files", extensions : "jpg,gif,png"},
            {title : "Zip files", extensions : "zip"}
        ],
        resize : {width : 800, height : 600, quality : 95}
    });
 
    uploader.bind('Init', function(up, params) {
        $('#filelist').html("<div>Current runtime: " + params.runtime + "</div>");
    });
    
    $('#uploadfiles').click(function(e) {
        uploader.start();
        e.preventDefault();
    });
 
    uploader.init();
 
    uploader.bind('FilesAdded', function(up, files) {
        $.each(files, function(i, file) {
            $('#filelist').append(
                '<div id="' + file.id + '">' +
                file.name + ' (' + plupload.formatSize(file.size) + ') <b></b>' +
            '</div>');
        });
 
        up.refresh(); // Reposition Flash/Silverlight
        log("FilesAdded, start upload");
        $(document).trigger('upload_in_progress', "Uploading photo");
        $('#upload-modal').modal('hide');
        uploader.start();
    });
 
    uploader.bind('UploadProgress', function(up, file) {
        // $('#' + file.id + " b").html(file.percent + "%");
        
    });
 
    uploader.bind('Error', function(up, err) {
        $('#filelist').append("<div>Error: " + err.code +
            ", Message: " + err.message +
            (err.file ? ", File: " + err.file.name : "") +
            "</div>"
        );
 
        up.refresh(); // Reposition Flash/Silverlight
    });
 
    uploader.bind('FileUploaded', function(up, file, response) {
        $('#' + file.id + " b").html("100%");
        // console.log(response.response);
        json_response = jQuery.parseJSON(response.response);
        Conference.send_img_url(json_response);
        $(document).trigger('upload_in_progress', "Sending photo to conference");
      
    });
    
};    