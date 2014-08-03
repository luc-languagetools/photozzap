function PhotozzapNickChangeModalCtrl($scope, $rootScope, $modalInstance, $log) {
    $scope.user_object = {};
    
    $scope.change = function() {
        $scope.nickname_change($scope.temp_data.new_nickname);
        $modalInstance.dismiss('close');
    }
    
    $scope.cancel = function() {
        $modalInstance.dismiss('close');
    }
}
