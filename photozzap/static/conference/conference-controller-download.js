
function DownloadCtrl($scope, $log, $timeout) {
    $scope.download_on_change = false;

    $scope.$watch("conference.download_zip_url", function(newValue, OldValue) {
        if( $scope.conference.download_zip_url != undefined && $scope.download_on_change ) {
            $scope.download_on_change = false;
            $scope.download_url($scope.conference.download_zip_url);
        }
    });
    
    $scope.download_current_photo = function() {
        // $scope.conference_user_object.viewing_image_id
        var photo_url = $scope.cloudinary_photo_download_url({id: $scope.conference_user_object.viewing_image_id});
        $scope.download_url(photo_url);
    };

    $scope.download_all_photos = function() {
        if ($scope.conference.download_zip_url == undefined) {

            // let the download fire when the url is set
            $scope.download_on_change = true;
        
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