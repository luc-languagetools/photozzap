
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
    
    service.resize_image_event = function(ev) {
        $rootScope.$broadcast('image_resize');
    }
    
    service.close_all_sidebars_event = function(ev) {
        $rootScope.$broadcast('close_sidebar');
    }
    
    $(document).bind('loaded_highres', service.loaded_highres_event);
    
    $(document).bind('display_image', service.display_image_event);
    
    $(document).bind('resize_image', service.resize_image_event);
    
    $(document).bind('close_all_sidebars', service.close_all_sidebars_event);
    
    return service;
});

function AppCtrl($scope, conferenceService) {
}

function TopSidebarCtrl($scope, $controller, conferenceService) {
    $controller('SidebarCtrl', {$scope: $scope, conferenceService: conferenceService});
}

function SidebarCtrl($scope, conferenceService) {
    $scope.image = undefined;
    $scope.size = undefined;
    $scope.expanded = false;
    
    $scope.expand = function() {
        $scope.expanded = true;
    };
    
    $scope.collapse = function() {
        log("SidebarCtrl.collapse");
        $scope.expanded = false;
    };
    
    $scope.class_state = function() {
        if ( $scope.expanded == true) {
            return "expanded";
        }
        return "collapsed";
    };
    
    $scope.element_style = function() {

        if ($scope.image == undefined || $scope.size == undefined) {
            return {'background-color': "#CCCCCC"};
        }
        
        var backgroundUrl = "url(" + $scope.image.blur_url() + ")";
        var sizeString = $scope.size.width + "px " + $scope.size.height + "px";
        
        return {'background-image': backgroundUrl,
                'background-size': sizeString,
                'background-repeat': 'no-repeat',
                'background-attachment': 'fixed',
                };        
    }
    
    $scope.$on('close_sidebar',  function() {
        $scope.expanded = false;
        $scope.$apply();
    });
        
    $scope.$on('image_change', function() {
        $scope.image = conferenceService.displayed_image;
        $scope.$apply();
    });    
    
    $scope.$on('image_resize', function() {
        var win = $(window);
        var winWidth = win.width();
        var winHeight = win.height();
        $scope.size = {width: winWidth, height: winHeight};
        $scope.$apply();
    });        
    
}

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
AppCtrl.$inject = ['$scope', 'conferenceService'];
SidebarCtrl.$inject = ['$scope', 'conferenceService'];
TopSidebarCtrl.$inject = ['$scope', '$controller', 'conferenceService'];