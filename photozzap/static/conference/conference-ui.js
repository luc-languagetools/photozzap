var CloudinaryGlobal = {
};

function show_upload_modal(cloudinary_signature) {
    CloudinaryGlobal.signature = cloudinary_signature;
    console.log("using cloudinary_signature: ", CloudinaryGlobal.signature);
	cloudinary_configure_resize(CloudinaryGlobal.signature);
    $('#upload-modal').modal('show');
}

function cloudinary_configure(resize) {
    if (resize) {
        cloudinary_configure_resize(CloudinaryGlobal.signature);
    } else {
        cloudinary_configure_no_resize(CloudinaryGlobal.signature);
    }
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
