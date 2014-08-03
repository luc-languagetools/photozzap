
function UploadCtrl($scope, $log) {
    $scope.resize = true;
    
    $scope.init = function() {
    
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
               // show_progress_bar();
               //console.log("UPLOAD EVENT fileuploadstart");
                $("#upload-progress-bar").css("width", "0%");
                $("#progress-bar-container").fadeIn();               
             });    
            
            $(".cloudinary-fileupload").bind('fileuploadprogressall', function(e, data) {
                // console.log("UPLOAD EVENT fileuploadprogressall ", data);
                $("#upload-progress-bar").css('width', Math.round((data.loaded * 100.0) / data.total) + '%'); 
                
            });
            
            $(".cloudinary-fileupload").bind('cloudinarydone', function(e){ 
                //console.log("UPLOAD EVENT cloudinarydone");
                $("#progress-bar-container").fadeOut();
            });
            
            $log.info("cloudinary events binding done");
        });
    }
    
    $scope.init();
    
    $scope.$watch("resize", function(newValue,oldValue) {
        $log.info("UploadCtrl resize: ", $scope.resize);
        $scope.cloudinary_configure($scope.resize);
    });
    
    $scope.$watch("conference.cloudinary_signature", function(newValue,oldValue) {
        $log.info("cloudinary signature updated");
        $scope.cloudinary_configure($scope.resize);
    }, true);
    
    $scope.cloudinary_configure = function(resize) {
        if (resize) {
            $scope.cloudinary_configure_resize();
        } else {
            $scope.cloudinary_configure_no_resize();
        }
    }
    
    
    $scope.cloudinary_configure_resize = function() {
        if ($scope.conference == undefined)
            return;
    
        //log("configuring cloudinary for resize on upload");
        $("input.cloudinary-fileupload[type=file]").fileupload({formData: $scope.conference.cloudinary_signature,
                                                                url: 'https://api.cloudinary.com/v1_1/photozzap/image/upload',
                                                                disableImageResize: false,
                                                                imageMaxWidth: 1024,
                                                                imageMaxHeight: 1024,
                                                                imageOrientation: true,
                                                                });    
    }
    
    $scope.cloudinary_configure_no_resize = function() {
        if ($scope.conference == undefined)
            return;    
    
        //log("configuring cloudinary for no resize on upload");
        $("input.cloudinary-fileupload[type=file]").fileupload({formData: $scope.conference.cloudinary_signature,
                                                                url: 'https://api.cloudinary.com/v1_1/photozzap/image/upload',
                                                                disableImageResize: true,
                                                                imageOrientation: true,
                                                                });    
    }
}