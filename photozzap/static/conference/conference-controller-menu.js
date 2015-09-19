conferenceModule.controller("PhotozzapMenuCtrl", 
["$scope", "$rootScope", "photozzapService", 
function($scope, $rootScope, photozzapService) {
    
    $scope.active_user_list = [];
    $scope.inactive_user_list = [];

    $scope.init = function() {
        photozzapService.getInitializedPromise().then(function(){
            // init here
            var conferenceNode = photozzapService.getConferenceNode();
            $scope.conference_name = conferenceNode.name;
            $scope.conference_owner_uid = conferenceNode.owner_uid;
            $scope.self_uid = photozzapService.getUid();
            $scope.watchUsersArray(photozzapService.getUsersArray());
        });
    };
    
    
    $scope.watchUsersArray = function(conferenceUsersArray){
        $scope.conference_users = conferenceUsersArray;
        $scope.processUsersArray();
        $scope.conference_users.$watch(function(){
            $scope.processUsersArray();
        });
    };    
    
    $scope.processUsersArray = function() {
        // retain users who are connected only
        var onlineUsers = _.filter($scope.conference_users, function(user) {
            return user.connected == true;
        });
        
        // don't keep us
        onlineUsers = _.filter(onlineUsers, function(user) {
            return user.$id != $scope.self_uid;
        });
        
        var userByState = _.groupBy(onlineUsers, function(user) {
            return user.page_visible;
        });
        
        $scope.active_user_list = userByState[true];
        $scope.inactive_user_list = userByState[false];
    };
    
    $scope.init();
    
}]);
