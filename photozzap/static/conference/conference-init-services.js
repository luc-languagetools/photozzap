var conferenceModule = angular.module('conferenceModule', ['ngAnimate', "firebase", 'angular-carousel', 'ui.bootstrap', 'angularMoment']);

conferenceModule.filter('orderObjectBy', function(){
 return function(input, attribute) {
    if (!angular.isObject(input)) return input;

    var array = [];
    for(var objectKey in input) {
        array.push(input[objectKey]);
    }

    array.sort(function(a, b){
        a = parseInt(a[attribute]);
        b = parseInt(b[attribute]);
        return a - b;
    });
    return array;
 }
});


conferenceModule.filter('orderObjectByAndInsertId', function(){
 return function(input, attribute) {
    if (!angular.isObject(input)) return input;

    var array = [];
    for(var objectKey in input) {
        input[objectKey].id = objectKey;
        array.push(input[objectKey]);
    }

    array.sort(function(a, b){
        a = parseInt(a[attribute]);
        b = parseInt(b[attribute]);
        return a - b;
    });
    return array;
 }
});

conferenceModule.factory('conferenceService', function ($rootScope, $log) {
    var service = {};
    
    $(document).bind('upload_image', function(ev, image_data) {
        $log.info("conferenceService: received upload_image event");
        $rootScope.$broadcast('upload_image_data', image_data);
    });
    
    return service;
});