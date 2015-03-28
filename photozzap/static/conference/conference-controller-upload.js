
function UploadCtrl($scope, $log) {
    $scope.resize = true;
    
    $scope.init = function() {
    
        $(document).ready(function() {
            UPLOADCARE_PUBLIC_KEY = '071cc18cd47faf518850';
            
            var multiWidget = uploadcare.MultipleWidget('[role=uploadcare-uploader][data-multiple]');
            multiWidget.onUploadComplete(function(info) {
                $log.info("UploadCtrl, onUploadComplete: ", info);
                
                uploadcare.loadFileGroup(info.cdnUrl)
                .done(function(fileGroup) {
                    $log.info("UploadCtrl, loadFileGroup: ", fileGroup);
                    var arrayOfFiles = fileGroup.files();
                    $.each(arrayOfFiles, function(i, file) {
                        file.done(function(fileInfo) {
                            // i is file positon in group.
                            // console.log(i, fileInfo);
                            $log.info("UploadCtrl, file: ", fileInfo);
                        });
                    });                    
                })
                .fail(function() {
                    $log.error("couldn't load file group");
                });
            });
            
        
            /*
            uploadcare.openDialog(null, {
                publicKey: "071cc18cd47faf518850",
                imagesOnly: true,
                multiple: true
            });
            */

            $.cloudinary.config({ cloud_name: 'photozzap', api_key: '751779366151643'})
            /*

            
            $(".cloudinary-fileupload").bind("fileuploaddone", function(e, data) {
                var image = {id: data.result.public_id,
                             width: data.result.width,
                             height: data.result.height};
               
                $(document).trigger('upload_image', image);
            });
            
            $(".cloudinary-fileupload").bind("fileuploadstart", function(e){
                $("#upload-progress-bar").css("width", "0%");
                $("#progress-bar-container").fadeIn();               
             });    
            
            $(".cloudinary-fileupload").bind('fileuploadprogressall', function(e, data) {
                $("#upload-progress-bar").css('width', Math.round((data.loaded * 100.0) / data.total) + '%'); 
                
            });
            
            $(".cloudinary-fileupload").bind('cloudinarydone', function(e){ 
                $("#progress-bar-container").fadeOut();
            });
            
            $log.info("cloudinary events binding done");
            */
        });
    }
    
    $scope.init();
    
    /*
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
    */
}