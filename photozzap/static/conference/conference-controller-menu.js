conferenceModule.controller("PhotozzapMenuCtrl", 
["$scope", "$rootScope", "photozzapService", 
function($scope, $rootScope, photozzapService) {

    $scope.init = function() {
        photozzapService.getInitializedPromise().then(function(){
            // init here
            var conferenceNode = photozzapService.getConferenceNode();
            $scope.conference_name = conferenceNode.name;
            $scope.conference_owner_uid = conferenceNode.owner_uid;
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
    
    $scope.init();
    
}]);
