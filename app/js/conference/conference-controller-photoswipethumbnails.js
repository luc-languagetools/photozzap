/* global _ */

conferenceModule.filter('photoswipeArray', function(){
    return function(input) {
        
    };
});

conferenceModule.controller("PhotoswipeUICtrl", ["$scope", "$rootScope", "$log", "photozzapService", function($scope, $rootScope, $log, photozzapService) {

    $scope.init = function() {
        $log.info("PhotoswipeUI.init");
        // photo that we're looking at right now
        $scope.currentlyViewingIndex = -1;
        // map from image id to list of users viewing that photo
        $scope.imageIdToUserListMap = {};
        
        $scope.mobile_view = screen.width < 768;
        
        // get user id
        photozzapService.getConferenceInitializedPromise().then(function(){
            $scope.uid = photozzapService.getUid();
            $scope.watchUsersArray(photozzapService.getUsersArray());
        });
    };
    
    $scope.watchUsersArray = function(conferenceUsersArray){
        $scope.conference_users = conferenceUsersArray;
        $scope.updateMap();
        $scope.conference_users.$watch(function(){
            $scope.updateMap();
        });
    };
    
    $scope.updateMap = function() {
        var validUsers = _.filter($scope.conference_users, function(user){
            return user.$id != $scope.uid // not us 
                   && user.connected == true
                   && user.page_visible == true; 
        });
        $scope.imageIdToUserListMap = _.groupBy(validUsers, function(user){
            return user.currently_viewing;
        });    
        
        $log.info("PhotoswipeUICtrl.updateMap ", $scope.imageIdToUserListMap);
    };
    
    $rootScope.$on("currently_viewing_id", function(event, image_id){
        $log.info("PhotoswipeUICtrl, currently viewing image_id ", image_id);
        $scope.currentlyViewingId = image_id;
    });

}]);


conferenceModule.controller("PhotoswipeThumbnailsCtrl", ["$scope", "$rootScope", "$log", "$q", "$firebaseObject", "photozzapService", function($scope, $rootScope, $log, $q, $firebaseObject, photozzapService) {

    $scope.init = function() {
        $scope.photoswipe_open = false;
        $log.info("PhotoswipeThumbnailsCtrl.init");
        
        $scope.determine_image_sizes();
        
        // map from image index to viewers currently viewing
        $scope.imageIdToUserListMap = {};
        
        photozzapService.getConferenceInitializedPromise().then(function(){
            // process initial image array
            $scope.processInitialImageArray(photozzapService.getImagesArray());
            // setup watch on users array
            $scope.watchUsersArray(photozzapService.getUsersArray());
        });        
    };

    $scope.determine_image_sizes = function() {
        var screen_width = screen.width;
        if(screen_width <= 1024) {
            $scope.thumbnail_width = 220;
        } 
        if(screen_width <= 600) {
            var avail_width = screen_width - 50;
            $scope.thumbnail_width = avail_width / 2;
        }
        
    };
    
    $scope.watchUsersArray = function(conferenceUsersArray){
        $scope.conference_users = conferenceUsersArray;
        $scope.updateUsersMap();
        $scope.conference_users.$watch(function(){
            $scope.updateUsersMap();
        });
    };
    
    $scope.updateUsersMap = function() {
        var validUsers = _.filter($scope.conference_users, function(user){
            return user.connected == true && user.page_visible == true; // connected
        });        
        $scope.imageIdToUserListMap = _.groupBy(validUsers, function(user){
            return user.currently_viewing;
        });    
    };    
    
    $scope.buildImageIndexMaps = function() {
        // build map from cloudinary image id to image index
        var i = 0;
        $scope.image_id_to_index = {};
        _.each($scope.images, function(image) {
            $scope.image_id_to_index[image.image_id] = i;
            i = i + 1;
        })
    }
    
    $scope.processInitialImageArray = function(images_array){
        $log.info("images loaded", images_array);
        $scope.images = _.map(images_array, $scope.convert_image);
        $scope.buildImageIndexMaps();
    };    
    
    // TODO: move this notification under the photozzapService
    $rootScope.$on("follow_user", function(event, follow_data){
        $log.info("PhotoswipeThumbnailsCtrl now following: ", follow_data.user_id);
        
        $scope.following_user = true;
        
        var userRecord = $scope.conference_users.$getRecord(follow_data.user_id);
        var image_index = $scope.image_id_to_index[userRecord.currently_viewing];
        $scope.open_image_index_follow(image_index);
        
        photozzapService.startFollowing(follow_data.user_id);
        
    });    
    
    $scope.unFollow = function() {
        // stop following user
        $log.info("PhotoswipeThumbnailsCtrl, unfollowing");
        photozzapService.unfollow();
        $scope.following_user = false;
    };
    
    $rootScope.$on("followed_user_viewing", function(event, data){
        $log.info("followed_user_viewing", data);
        var image_id = data.image_id;
        var image_index = $scope.image_id_to_index[image_id];
        $scope.open_image_index_follow(image_index);
    });
    
    $rootScope.$on("image_added", function(event, eventData){
        var imageIndex = eventData.imageIndex;
        var imageData = eventData.imageData;
        $log.info("image added at index ", imageIndex, imageData);
        $scope.images.push($scope.convert_image(imageData));
        $scope.image_id_to_index[imageData.id] = $scope.images.length - 1;
    });
    
    $scope.convert_image = function(image_data){
        var photoswipe_image = {src:   $scope.cloudinary_photoswipe_original_url(image_data),
                                msrc:  $scope.cloudinary_photoswipe_thumbnail_url(image_data),
                                square_thumb: $scope.cloudinary_photoswipe_square_thumbnail_url(image_data), 
                                w: image_data.width,
                                h: image_data.height,
                                image_id: image_data.id};
        return photoswipe_image;
    };
    
    $scope.cloudinary_photoswipe_original_url = function(image_data) {
        return $.cloudinary.url(image_data.id + ".jpg");
    };    

    $scope.cloudinary_photoswipe_thumbnail_url = function(image_data) {
        return $.cloudinary.url(image_data.id + ".jpg", {crop: 'fit', 
                                                         width: 500, 
                                                         height: 500,
                                                         quality: 85,
                                                         sharpen: 400});
    };    
    
    $scope.cloudinary_photoswipe_square_thumbnail_url = function(image_data) {
        return $.cloudinary.url(image_data.id + ".jpg", {crop: 'fill', 
                                                         width: 300, 
                                                         height: 240,
                                                         quality: 85,
                                                         sharpen: 400});
    };        
    
    $scope.open_image_index_follow = function(imageIndex) {
        $scope.follow_event = true;
        $scope.open_image_index(imageIndex);
    };
    
    $scope.open_image_index = function(imageIndex) {
        if(imageIndex != undefined) {    
            if(! $scope.photoswipe_open) {
                // open at the right index
                $scope.thumbnail_click(imageIndex);
            } else {
                // move existing photoswipe instance to the correct index
                $scope.photoswipe.goTo(imageIndex);
            }    
        }
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
        $scope.photoswipe.listen('followme', function() {
           $log.info("follow requested"); 
           photozzapService.requestFollowMe();
        });
        $scope.photoswipe.listen('close', function() { 
            $log.info("photoswipe gallery closed");
            $scope.photoswipe_open = false;
            photozzapService.currentlyViewing(null);
            $scope.$apply();
        });
        
        // wait until photoswipe is opened once before using beforeChange event
        
        $scope.photoswipe.listen('initialZoomInEnd', function() {
            $scope.reportCurrentlyViewingIndex();
            $scope.photoswipe.listen('beforeChange', function(){
                $log.info("PhotoswipeThumbnailsCtrl, event beforeChange");
                $scope.reportCurrentlyViewingIndex();
            });            
        });
        
        $scope.photoswipe.init();
    };
    
    $scope.reportCurrentlyViewingIndex = function() {
        var currentlyViewingIndex = $scope.photoswipe.getCurrentIndex();
        $log.info("reportCurrentlyVewingIndex: ", currentlyViewingIndex);
        var image_id = $scope.images[currentlyViewingIndex].image_id;
        $log.info("currently viewing index: ", currentlyViewingIndex, "cloudinary id:", image_id);
        photozzapService.currentlyViewing(image_id);

        // the photoswipe UI controller listen to this
        $rootScope.$emit("currently_viewing_id", image_id);
      
        // was this event triggered by a follow event ? if not, it's a user-initiated click and we should unfollow
        if(! $scope.follow_event) {
            if($scope.following_user) {
                $scope.unFollow();
            }
        }
        $scope.follow_event = false;
      
    };
    
}]);
