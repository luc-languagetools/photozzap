
conferenceModule.factory('photozzapService', ["$rootScope", "$log", "photozzapConfig", function ($rootScope, $log, photozzapConfig) {
    var service = {};
    
    $log.info("photozzapService initialize, photozzapConfig:", photozzapConfig);
    
    return service;
}]);