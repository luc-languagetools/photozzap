
conferenceModule.controller("PhotozzapHomeController", ["$scope", "$modal", "$log", "photozzapService", function ($scope, $modal, $log, photozzapService) { 
   
    photozzapService.initialize(null);
   
    $scope.open_add_conf_modal = function() {
        $log.info("PhotozzapHomeController.open_add_conf_modal");
        $scope.modalInstance = $modal.open({templateUrl: "create_conf_modal.html",
                                            controller: "PhotozzapNewConfModalController"});
    };
    
    $scope.cancel = function() {
        $log.info("PhotozzapHomeController.cancel");
    };
    
}]);

conferenceModule.controller("PhotozzapNewConfModalController", ["$scope", "$rootScope", "$modalInstance", "$log", "$window", "$state", "photozzapService", 
function ($scope, $rootScope, $modalInstance, $log, $window, $state, photozzapService) {
    $scope.form_data = {};

    $scope.init = function() {
        photozzapService.getInitializedPromise().then(function(){
            // setup 3 way binding with global user object
            photozzapService.getGlobalUserNode().$bindTo($scope, "global_user_object");
        });
        
    }
    $scope.init();
    
    $scope.ok = function () {
        photozzapService.create_conference($scope.form_data.confname).then(function(confKey){
            $log.info("created conference, key: ", confKey);
            $modalInstance.dismiss('ok');
            $state.go('view', {conferenceKey: confKey});
        });
    };
    
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };        
}]);
