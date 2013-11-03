
var conferenceModule = angular.module('conferenceModule', []);
conferenceModule.factory('conferenceService', function ($rootScope) {
    var service = {};
    
    service.display_image = undefined;
    
    service.display_image_event = function(ev, image) {
        service.displayed_image = image;
        log("broadcasting image_change, image: " + image);
        $rootScope.$broadcast('image_change');
    };
    
    service.loaded_highres_event = function(ev) {
        $rootScope.$broadcast('image_change');
    };
    
    $(document).bind('loaded_highres', service.loaded_highres_event);
    
    $(document).bind('display_image', service.display_image_event);
    
    return service;
});

function ImageCtrl($scope, conferenceService) {
    $scope.image = undefined;

    $scope.showing_image = function() {
        var result = false;
        if ($scope.image != undefined) {
            result = true;
        }
        return result;
    };
    
    $scope.image_id = function() {
        var result = "n/a";
        if ($scope.showing_image()) {
            result = $scope.image.id;
        };
        log("$scope.image_id, result: " + result);
        return result;
    };
    
    $scope.image_src = function() {
        result = "";
        if( $scope.showing_image() ) {
            result = $scope.image.image_url();
        }
        return result;
    };

    $scope.blur_src = function() {
        result = "";
        if( $scope.showing_image() ) {
            result = $scope.image.blur_url();
        }
        return result;
    };
    
    $scope.$on('image_change', function() {
        log("controller on image_change");
        $scope.image = conferenceService.displayed_image;
        log("$scope.image.id is: " + $scope.image.id);
        $scope.$apply();
    });
}

ImageCtrl.$inject = ['$scope', 'conferenceService'];