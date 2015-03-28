
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
                            
                            $(".cloudinary_fileupload").cloudinary_upload_url(fileInfo.cdnUrl);
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

            $.cloudinary.config({ cloud_name: 'photozzap', api_key: '751779366151643'});

            $('#cloudinary_unsigned_upload_form').append(
                    $.cloudinary.unsigned_upload_tag("photozzap_unsigned", 
                        { cloud_name: 'photozzap', tags: [$scope.conf_key, $scope.server_name, $scope.server_env] },
                        {dropZone: $("#cloudinary_drop_zone")})
                        .bind('cloudinarydone', function(e, data) {            
                            $log.info("cloudinary upload data: ", data);
                        })
            );            

        });
    }
    
    $scope.init();

}