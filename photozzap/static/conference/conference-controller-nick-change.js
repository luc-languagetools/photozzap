conferenceModule.controller("PhotozzapNickChangeModalCtrl", ["$scope", "$rootScope", "$modalInstance", "$log", "photozzapService",
function($scope, $rootScope, $modalInstance, $log, photozzapService) {
    
    $scope.change = function() {
        photozzapService.changeNickname($scope.temp_data.new_nickname);
        $modalInstance.dismiss('close');
    }
    
    $scope.cancel = function() {
        $modalInstance.dismiss('close');
    }
}]);