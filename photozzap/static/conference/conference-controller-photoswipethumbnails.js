
function PhotoswipeThumbnailsCtrl($scope, $log) {

    $scope.init = function() {
        $log.info("PhotoswipeThumbnailsCtrl.init");
    };

    $scope.thumbnail_click = function(index) {
        $log.info("photoswipeThumbnailsCtrl.thumbnail_click");
    };
    
};
