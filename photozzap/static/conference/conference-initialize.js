
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
    
    // setup plupload
    setup_uploader();
    
    // connect to jabber and conference
    ready_for_connection();

    // setup controls
    setupControlHandlers();    
    resizeHandler();    
    
});