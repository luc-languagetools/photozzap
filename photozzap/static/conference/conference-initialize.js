
$(document).ready(function() {

    // prevent form submission from happening on all forms
    $('form').submit(function() {
      return false;
    });

    $("#comment-input").keyup(function (e) {
        if (e.keyCode == 13) {
            $(document).trigger('send_comment');
        }
    });
    $("#comment-submit").click(function() {
        $(document).trigger('send_comment');
    });
    
    // connect to jabber and conference
    ready_for_connection();

    // setup controls
    setupControlHandlers();    
    resizeHandler();    

    $.cloudinary.config({ cloud_name: 'photozzap', api_key: '751779366151643'})
    
    $(".cloudinary-fileupload").bind("fileuploaddone", function(e, data) {
        log("fileuploaddone, data: " + data);
        // data.result.public_id
        // data.result.height
        // data.result.width
        var image = {id: data.result.public_id,
                     width: data.result.width,
                     height: data.result.height};
        Conference.send_img_url(image);
    });
    
    $(".cloudinary-fileupload").bind("fileuploadstart", function(e){
       log("fileuploadstart");
     });    
    
    $("#upload-cloudinary").on('click', function(){
        log("starting cloudinary file upload");
        $(".cloudinary-fileupload").fileupload();
    });
    
});