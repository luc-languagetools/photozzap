conferenceModule.controller("UploadCtrl", ["$scope", "$log", "photozzapService", "photozzapConfig", function($scope, $log, photozzapService, photozzapConfig) {
    $scope.resize = true;
    
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
            var multiWidget2 = uploadcare.MultipleWidget('[role=uploadcare-uploader][data-multiple][data-widget-2]');
            multiWidget1.value(null);
            multiWidget2.value(null);
        })
        .fail(function(error) {
            $log.error("couldn't load file group ", error);
        });    
    };
    
    $scope.init = function() {
   
        photozzapService.getConferenceInitializedPromise().then(function(){
   

            
            var multiWidget1 = uploadcare.MultipleWidget('[role=uploadcare-uploader][data-multiple][data-widget-1]');
            var multiWidget2 = uploadcare.MultipleWidget('[role=uploadcare-uploader][data-multiple][data-widget-2]');
            multiWidget1.onUploadComplete(function(info) {
                $scope.uploadcare_on_upload_complete(info);
            });
            multiWidget2.onUploadComplete(function(info) {
                $scope.uploadcare_on_upload_complete(info);
            });            
            
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