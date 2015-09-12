conferenceModule.controller("FollowCtrl", ["$scope", "$log", "$timeout", function($scope, $log, $timeout) {

    $scope.follow_me = function() {
        $log.info("follow_me");
        var requestRef = $scope.requests_ref.push({user_id: $scope.login_obj.user.uid,
                                                   nickname: $scope.conference_user_object.nickname,
                                                   timestamp: Firebase.ServerValue.TIMESTAMP,
                                                   type: "follow_me"});
        $timeout(function() {
                    $scope.remove_request(requestRef)
                 }, 5000);
        
    }
    
    $scope.look_here = function() {
        $log.info("look_here");
        var requestRef = $scope.requests_ref.push({user_id: $scope.login_obj.user.uid,
                                                   nickname: $scope.conference_user_object.nickname,
                                                   image_id: $scope.conference_user_object.viewing_image_id,
                                                   timestamp: Firebase.ServerValue.TIMESTAMP,
                                                   type: "look_here"});
        $timeout(function() {
                    $scope.remove_request(requestRef)
                 }, 5000);
        
    }
    
    $scope.remove_request = function(requestRef) {
        $log.info("removing request: ", requestRef);
        requestRef.remove();
    }
    
}]);