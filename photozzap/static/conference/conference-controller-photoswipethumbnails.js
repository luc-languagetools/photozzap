
conferenceModule.filter('photoswipeArray', function(){
    return function(input) {
        
    };
});

conferenceModule.controller("PhotoswipeThumbnailsCtrl", ["$scope", "$rootScope", "$log", function($scope, $rootScope, $log) {

    $scope.init = function() {
        $scope.photoswipe_open = false;
        $log.info("PhotoswipeThumbnailsCtrl.init");
    };

    $rootScope.$on("images_loaded", function(event, images_array){
        $log.info("images loaded", images_array);
        $scope.images = _.map(images_array, function(image_data){
            return $scope.convert_image(image_data);
        });
    });    
    
    $rootScope.$on("image_added", function(event, eventData){
        var imageIndex = eventData.imageIndex;
        var imageData = eventData.imageData;
        $log.info("image added at index ", imageIndex, imageData);
        $scope.images.push($scope.convert_image(imageData));
    });
    
    $scope.convert_image = function(image_data){
        var photoswipe_image = {src:   $scope.cloudinary_photoswipe_original_url(image_data),
                                msrc:  $scope.cloudinary_photoswipe_thumbnail_url(image_data),
                                square_thumb: $scope.cloudinary_photoswipe_square_thumbnail_url(image_data), 
                                w: image_data.width,
                                h: image_data.height};
        return photoswipe_image;
    };
    
    $scope.cloudinary_photoswipe_original_url = function(image_data) {
        return $.cloudinary.url(image_data.id + ".jpg");
    };    

    $scope.cloudinary_photoswipe_thumbnail_url = function(image_data) {
        return $.cloudinary.url(image_data.id + ".jpg", {crop: 'fit', 
                                                         width: 500, 
                                                         height: 500,
                                                         quality: 80,
                                                         sharpen: 400});
    };    
    
    $scope.cloudinary_photoswipe_square_thumbnail_url = function(image_data) {
        return $.cloudinary.url(image_data.id + ".jpg", {crop: 'fill', 
                                                         width: 250, 
                                                         height: 200,
                                                         quality: 80,
                                                         sharpen: 400});
    };        
    
    $scope.thumbnail_click = function(index) {
        $log.info("photoswipeThumbnailsCtrl.thumbnail_click");
        
        var pswpElement = document.querySelectorAll('.pswp')[0];
        
        options = {
            index: index,
            history: false,
            showHideOpacity:true,
            getThumbBoundsFn: function(index) {
                // See Options -> getThumbBoundsFn section of docs for more info
                var thumbnail = document.getElementById('thumbnail_id_' + index);
                var pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
                    rect = thumbnail.getBoundingClientRect();

                return { x:rect.left, y:rect.top + pageYScroll, w:rect.width };
            },
            maxSpreadZoom: 4,
            getDoubleTapZoom: function(isMouseClick, item) {
                // isMouseClick          - true if mouse, false if double-tap
                // item                  - slide object that is zoomed, usually current
                // item.initialZoomLevel - initial scale ratio of image
                //                         e.g. if viewport is 700px and image is 1400px,
                //                              initialZoomLevel will be 0.5
                if(isMouseClick) {
                    // is mouse click on image or zoom icon
                    // zoom to original
                    return 1;
                    // e.g. for 1400px image:
                    // 0.5 - zooms to 700px
                    // 2   - zooms to 2800px
                } else {
                    // is double-tap
                    // zoom to original if initial zoom is less than 0.7x,
                    // otherwise to 1.5x, to make sure that double-tap gesture always zooms image
                    return item.initialZoomLevel < 0.7 ? 1 : 1.5;
                }
            }
        };

        // Pass data to PhotoSwipe and initialize it
        $scope.photoswipe_open = true;
        $scope.photoswipe = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, $scope.images, options);
        $scope.photoswipe.listen('close', function() { 
            $log.info("photoswipe gallery closed");
            $scope.photoswipe_open = false;
            $scope.$apply();
        });
        $scope.photoswipe.init();
    };
    
    
    
}]);
