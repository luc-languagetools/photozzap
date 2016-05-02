conferenceModule.controller("PhotozzapCtrl", 
["$scope", "$rootScope", "$log", "$window", "$filter", "$http", "$q", "$timeout", "$location", "$timeout", "$stateParams", "photozzapService", 
function($scope, $rootScope, $log, $window, $filter, $http, $q, $timeout, $location, $timeout,  $stateParams, photozzapService) {
   

    $scope.show_default_nickname_notification = false;
    $scope.sorted_notifications = [];

    $scope.sorted_users = [];

    
    $scope.logged_in_and_ready = false;
    $scope.status_string = "loading";
    
    $scope.perform_setup_on_login = false;
    $scope.new_nickname = undefined;
   
    $scope.watching_photo_index = false;
    $scope.load_new_url_promise = undefined;
    $scope.last_load_hires_timestamp = 0;
    
    $scope.watch_followed_user_handle = undefined;
    $scope.followed_user_image_id = undefined;
  
    $scope.show_photo_counter = false;
    $scope.show_photo_timeout = undefined;
  
    $scope.init = function() {
        var conference_key = $stateParams.conferenceKey;
        $log.info("initializing PhotozzapCtrl, conference_key: ", conference_key);
        
        photozzapService.initializeConference(conference_key);
        photozzapService.getConferenceInitializedPromise().then(function(){
            $scope.logged_in_and_ready = true;
            $scope.watch_page_visibility();
        });
    }
    
  
    $scope.watch_page_visibility = function() {
        if ($.support.pageVisibility) {
            $log.info("page visibility API supported");
            
            $(document).on({
                'show.visibility': function() {
                    $log.info("page visible");
                    photozzapService.markPageVisible();
                },
                'hide.visibility': function() {
                    $log.info("page not visible");
                    photozzapService.markPageNotVisible();
                }
            });            
        } else {
            $log.info("page visibility API not supported");
        }
    }
   
   
    // todo: integrate with photoswipe
    $scope.cloudinary_photo_download_url = function(image_data) {
        return $.cloudinary.url(image_data.id + ".jpg", {flags: 'attachment'});
    };
    
    // run init
    $scope.init();
    
}]);
