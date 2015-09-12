
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

conferenceModule.controller("PhotozzapNewConfModalController", ["$scope", "$rootScope", "$modalInstance", "$log", "$window", "photozzapService", 
function ($scope, $rootScope, $modalInstance, $log, $window, photozzapService) {
    $scope.form_data = {};

    $scope.init = function() {
        photozzapService.getInitializedPromise().then(function(){
            // setup 3 way binding with global user object
            photozzapService.getGlobalUserNode().$bindTo($scope, "global_user_object");
        });
        
    }
    $scope.init();
    
    $scope.ok = function () {
        photozzapService.create_conference($scope.form_data.confname).then(function(url){
            $log.info("created conference, url: ", url);
        });
    };
    
    /*
    $scope.create_unique_conf_key = function(confName, owner_uid) {
        // set owner nickname
        $scope.global_user_object.$update({nickname: $scope.global_user_object.nickname});
    
        var prefix = randomString(6);
        var confNameEncoded = confName.replace(/[^a-zA-Z0-9]/g, "-");
        var tentativeConfKey = prefix + "-" + confNameEncoded;
        var confRef = new Firebase("${firebase}photozzap/conferences/" + tentativeConfKey);
        confRef.on('value', function(snapshot) {
            confRef.off('value');
            if(snapshot.val() === null) {
                $log.info("conference " + tentativeConfKey + " does not exist, creating");
                var conferences_node = $firebase(new Firebase("${firebase}photozzap/conferences"));
                var conference_node = conferences_node.$child(tentativeConfKey);
                var conf_url = "${new_conf_url}".replace("new-conference-template", tentativeConfKey);
                var permanent_conf_url = "${permanent_conf_url}".replace("new-conference-template", tentativeConfKey);
                var conference_data = {name: confName,
                             url: conf_url,
                             permanent_url: permanent_conf_url,
                             servername: "${server_name}",
                             owner_uid: owner_uid,
                             status: "open",
                             notify_pushover: false,
                             create_time: new Date().getTime(),
                             close_after_time: new Date().getTime() + 7 * 24 * 60 * 60 * 1000}; // shutdown after 7 days
                // alert("setting conference data: " + JSON.stringify(conference_data));
                conference_node.$update(conference_data).then(function(ref) {
                    $scope.status = "conference " + tentativeConfKey + " created";
                    $window.location.href = conf_url;
                });

                // $scope.$apply();
                // redirect to conference URL
            } else {
                $log.info("conference " + tentativeConfKey + " already exists, trying again");
                $scope.create_unique_conf_key(confName, owner_uid);
            }
        });            
    };
    */
    
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };        
}]);
