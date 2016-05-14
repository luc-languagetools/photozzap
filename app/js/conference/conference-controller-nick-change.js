conferenceModule.controller("PhotozzapNickChangeModalCtrl", ["$scope", "$rootScope", "$uibModalInstance", "$log", "photozzapService",
function($scope, $rootScope, $uibModalInstance, $log, photozzapService) {
    
    $scope.change = function() {
        photozzapService.changeNickname($scope.temp_data.new_nickname);
        $uibModalInstance.dismiss('close');
    }
    
    $scope.cancel = function() {
        $uibModalInstance.dismiss('close');
    }
}]);