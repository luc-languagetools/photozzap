
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
                            $log.info("UploadCtrl, file: ", fileInfo);
                            $(".cloudinary_fileupload").cloudinary_upload_url(fileInfo.cdnUrl);
                        });
                    });  

                    // clear file list
                    var multiWidget = uploadcare.MultipleWidget('[role=uploadcare-uploader][data-multiple]');
                    multiWidget.value(null);
                })
                .fail(function() {
                    $log.error("couldn't load file group");
                });
            });
            
            $.cloudinary.config({ cloud_name: 'photozzap', api_key: '751779366151643'});

            // setup cloudinary unsigned upload
            $('#cloudinary_unsigned_upload_form').append(
                    $.cloudinary.unsigned_upload_tag("photozzap_unsigned", 
                        { cloud_name: 'photozzap', tags: [$scope.conf_key, $scope.server_name, $scope.server_env] },
                        {dropZone: $("#cloudinary_drop_zone")})
                        .bind('cloudinarydone', function(e, data) {            
                            $log.info("cloudinary upload data: ", data);
                            
                            var image = {id: data.result.public_id,
                                         width: data.result.width,
                                         height: data.result.height};

                            $(document).trigger('upload_image', image);
                            
                        })
            );            

        });
    }
    
    $scope.init();

}