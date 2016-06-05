/* globals conferenceModule */
/* globals uploadcare */
/* globals $ */

conferenceModule.controller("UploadCtrl", ["$scope", "$log", "photozzapService", "photozzapConfig", function($scope, $log, photozzapService, photozzapConfig) {
    $scope.resize_mode = "resize";
    
    $scope.uploadcare_on_upload_complete = function(info) {
        $log.info("UploadCtrl, onUploadComplete: ", info);
        
        uploadcare.loadFileGroup(info.cdnUrl)
        .done(function(fileGroup) {
            $log.info("UploadCtrl, loadFileGroup: ", fileGroup);
            var arrayOfFiles = fileGroup.files();
            $.each(arrayOfFiles, function(i, file) {
                file.done(function(fileInfo) {
                    // $log.info("UploadCtrl, file: ", fileInfo);
                    
                    $log.info("Uploadcare upload done, dimensions: width: ",
                              fileInfo.originalImageInfo.width,
                              "height:",
                              fileInfo.originalImageInfo.height);
                    
                    $(".cloudinary_fileupload").cloudinary_upload_url(fileInfo.cdnUrl);
                });
            });  

            // clear file list
            var multiWidget1 = uploadcare.MultipleWidget('[role=uploadcare-uploader][data-multiple][data-widget-1]');
            multiWidget1.value(null);
        })
        .fail(function(error) {
            $log.error("couldn't load file group ", error);
        });    
    };
   
    $scope.watch_resize_mode = function() {
        $scope.$watch("resize_mode", function() {
           $scope.rebuild_widget();
        });
    }
   
    $scope.rebuild_widget = function () {
        if( $scope.resize_mode == "resize" ) {
            $log.info("upload resized");
            $('#uploader').attr('data-image-shrink', '1024x768');
        } else {
            $log.info("upload full size");
            $('#uploader').attr('data-image-shrink', '');
        }

        
        var oldWidget = uploadcare.MultipleWidget('#uploader');
        $(oldWidget.inputElement)
            .next('.uploadcare-widget')
            .remove();
        var input = $(oldWidget.inputElement).clone()
            .replaceAll(oldWidget.inputElement);

        var widget = uploadcare.MultipleWidget(input);
        widget.value(oldWidget.value());
        for (var i = 0; i < oldWidget.validators.length; i++) {
            widget.validators.push(oldWidget.validators[i]);
        }
        
        widget.onUploadComplete(function(info) {
            $scope.uploadcare_on_upload_complete(info);
        });        
        
        $(".uploadcare-widget-button-open").html("<span class=\"icon-upload\"></span> Choose Images")
    }
    
    $scope.init = function() {
   
        photozzapService.getConferenceInitializedPromise().then(function(){

            $scope.rebuild_widget();
            $scope.watch_resize_mode();
   
            // setup cloudinary unsigned upload
            $('#cloudinary_unsigned_upload_form').append(
                    $.cloudinary.unsigned_upload_tag("photozzap_unsigned", 
                        { cloud_name: 'photozzap', 
                          tags: [photozzapService.getConferenceKey(), photozzapConfig.environment, "photozzap"],
                          folder: "photozzap_" + photozzapConfig.environment},
                        {dropZone: $("#cloudinary_drop_zone")})
                        .bind('cloudinarydone', function(e, data) {            
                            $log.info("cloudinary upload data: ", data);
                            
                            $log.info("cloudinary upload done, dimensions: width: ",
                                      data.result.width,
                                      "height",
                                      data.result.height);
                            
                            var imageData = {id: data.result.public_id,
                                             width: data.result.width,
                                             height: data.result.height};

                            photozzapService.addImage(imageData);
                            
                            
                        })
            );            


        });
            
    };
    
    $scope.init();

}]);