function show_upload_modal() {
    $.get('/upload_data', function(upload_data) {
        //log("received upload data: " + upload_data);
		cloudinary_configure_resize(upload_data);
        $('#upload-modal').modal('show');
    });
}

function cloudinary_configure(resize) {
    $.get('/upload_data', function(upload_data) {
        //log("received upload data: " + upload_data);
		if (resize) {
			cloudinary_configure_resize(upload_data);
		} else {
			cloudinary_configure_no_resize(upload_data);
		}
    });	
}

function cloudinary_configure_resize(upload_data) {
	//log("configuring cloudinary for resize on upload");
	$("input.cloudinary-fileupload[type=file]").fileupload({formData: upload_data,
															url: 'https://api.cloudinary.com/v1_1/photozzap/image/upload',
															disableImageResize: false,
															imageMaxWidth: 1024,
															imageMaxHeight: 1024,
                                                            imageOrientation: true,
															});
}

function cloudinary_configure_no_resize(upload_data) {
	//log("configuring cloudinary for no resize on upload");
	$("input.cloudinary-fileupload[type=file]").fileupload({formData: upload_data,
															url: 'https://api.cloudinary.com/v1_1/photozzap/image/upload',
															disableImageResize: true,
                                                            imageOrientation: true,
															});
}

function hide_upload_modal() {
    $('#upload-modal').modal('hide');
}

function show_progress_bar() {
    $("#progress-bar .bar").css("width", "0%");
    $("#progress-bar-label").html("Uploading image(s)"); 
    $("#progress-container").fadeIn();
}

function hide_progress_bar() {
    $("#progress-container").fadeOut();
    $("#progress-bar-label").html("");
}

function update_progress_bar(e, data) { 
    $("#progress-bar .bar").css('width', Math.round((data.loaded * 100.0) / data.total) + '%'); 
}

String.prototype.trunc = String.prototype.trunc ||
      function(n){
          return this.length>n ? this.substr(0,n-1)+'&hellip;' : this;
      };
