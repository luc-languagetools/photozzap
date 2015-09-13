conferenceModule.controller("UploadCtrl", ["$scope", "$log", "photozzapService", function($scope, $log, photozzapService) {
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
        .fail(function() {
            $log.error("couldn't load file group");
        });    
    };
    
    $scope.init = function() {
   
        $(document).ready(function() {
            UPLOADCARE_PUBLIC_KEY = '071cc18cd47faf518850';
            
            var multiWidget1 = uploadcare.MultipleWidget('[role=uploadcare-uploader][data-multiple][data-widget-1]');
            var multiWidget2 = uploadcare.MultipleWidget('[role=uploadcare-uploader][data-multiple][data-widget-2]');
            multiWidget1.onUploadComplete(function(info) {
                $scope.uploadcare_on_upload_complete(info);
            });
            multiWidget2.onUploadComplete(function(info) {
                $scope.uploadcare_on_upload_complete(info);
            });            
            
            $.cloudinary.config({ cloud_name: 'photozzap', api_key: '751779366151643'});

            // setup cloudinary unsigned upload
            $('#cloudinary_unsigned_upload_form').append(
                    $.cloudinary.unsigned_upload_tag("photozzap_unsigned", 
                        { cloud_name: 'photozzap', tags: [$scope.conf_key, $scope.server_name, $scope.server_env] },
                        {dropZone: $("#cloudinary_drop_zone")})
                        .bind('cloudinarydone', function(e, data) {            
                            $log.info("cloudinary upload data: ", data);
                            
                            // $log.info("cloudinary upload done, data: ", data);                            
                            
                            $log.info("cloudinary upload done, dimensions: width: ",
                                      data.result.width,
                                      "height",
                                      data.result.height);
                            
                            var imageData = {id: data.result.public_id,
                                             width: data.result.width,
                                             height: data.result.height};

                            // $(document).trigger('upload_image', image);
                            photozzapService.addImage(imageData);
                            
                            
                        })
            );            

        });
    }
    
    $scope.init();

}]);