
function DownloadCtrl($scope, $log, $timeout) {
    $scope.awaiting_download = false;
    $scope.current_image_download_url = undefined;

    $scope.$watch("conference_user_object.viewing_image_id", function(newValue, oldValue) {
        $scope.current_image_download_url = $scope.cloudinary_photo_download_url({id: $scope.conference_user_object.viewing_image_id});
    });
    
    $scope.$watch("conference.download_zip_url", function(newValue, OldValue) {
        if( $scope.conference.download_zip_url != undefined && $scope.awaiting_download ) {
            $scope.awaiting_download = false;
            $scope.download_url($scope.conference.download_zip_url);
        }
    });
    
    $scope.download_all_photos = function() {
        if ($scope.conference.download_zip_url == undefined) {

            // let the download fire when the url is set
            $scope.awaiting_download = true;
        
            // request download
            var requestRef = $scope.requests_ref.push({user_id: $scope.login_obj.user.uid,
                                                      timestamp: Firebase.ServerValue.TIMESTAMP,
                                                      type: "download_all"});
            $timeout(function() {
                        requestRef.remove();
                     }, 5000);
        } else {
            $scope.download_url($scope.conference.download_zip_url);
        }
    }
    
    $scope.download_url = function(url) {
        var ifrm = document.getElementById('download_frame');
        ifrm.src = url;
    }

}