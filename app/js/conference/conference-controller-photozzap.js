conferenceModule.controller("PhotozzapCtrl", 
["$scope", "$rootScope", "$log", "$window", "$filter", "$http", "$q", "$timeout", "$location", "$timeout", "$state", "$stateParams", "photozzapService", 
function($scope, $rootScope, $log, $window, $filter, $http, $q, $timeout, $location, $timeout,  $state, $stateParams, photozzapService) {
   
    $scope.logged_in_and_ready = false;
    $scope.conference_closed = false;
  
    $scope.init = function() {
        var conference_key = $stateParams.conferenceKey;
        $log.info("initializing PhotozzapCtrl, conference_key: ", conference_key);
        
        photozzapService.initializeConference(conference_key);
        photozzapService.getConferenceInitializedPromise().then(function(){
            $scope.logged_in_and_ready = true;
            $scope.watch_page_visibility();
            $scope.watch_conference_status();
        }, function(msg) {
            $scope.conference_error = true;
            $scope.conference_error_msg = msg;
        });
    }
    
    $scope.go_to_homepage = function() {
        $state.go('home');
    }
  
    $scope.evaluate_conference_status = function(status) {
        if( status == "closed" ){
            // close
            $log.info("conference closed");
            $scope.conference_closed = true;
        }
    }
  
    $scope.watch_conference_status = function() {
        $scope.conference_node = photozzapService.getConferenceNode();
        $scope.evaluate_conference_status($scope.conference_node.status);
        $scope.conference_node.$watch(function() {
            $scope.evaluate_conference_status($scope.conference_node.status);
        })
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
