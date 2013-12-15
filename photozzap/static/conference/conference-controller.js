
var conferenceModule = angular.module('conferenceModule', []);
conferenceModule.factory('conferenceService', function ($rootScope) {
    var service = {};
    
    service.display_image = undefined;
    
    service.display_image_event = function(ev, image) {
        service.displayed_image = image;
        log("broadcasting image_change, image: " + image);
        $rootScope.$broadcast('image_change');
    };
    
    service.display_image_internal_event = function(ev, image) {
        service.displayed_image = image;
        $rootScope.$broadcast('image_change_internal');
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
    
    service.close_all_sidebars_internal_event = function(ev) {
        $rootScope.$broadcast('close_sidebar_internal');
    }    
    
    service.image_list_update_event = function(ev) {
        $rootScope.$broadcast('image_list_update_event');
    }

    
    $(document).bind('loaded_highres', service.loaded_highres_event);
    
    $(document).bind('display_image', service.display_image_event);
    
    $(document).bind('display_image_internal', service.display_image_internal_event);
    
    $(document).bind('resize_image', service.resize_image_event);
    
    $(document).bind('close_all_sidebars', service.close_all_sidebars_event);
    
    $(document).bind('close_all_sidebars_internal', service.close_all_sidebars_internal_event);
    
    $(document).bind('new_image', service.image_list_update_event);
    
    $(document).bind('new_comment', service.image_list_update_event);
    
    return service;
});


function TopSidebarCtrl($scope, $controller, conferenceService) {
    $controller('SidebarCtrl', {$scope: $scope, conferenceService: conferenceService});
    $scope.image_list = [];
    
    $scope.select_image = function(image_id) {
        log("selected image: " + image_id);
        var image = Conference.images[image_id];
        $(document).trigger('not_following_user');
        $(document).trigger('show_current_image', false);
        $(document).trigger('display_image_internal', image);
        $(document).trigger('hide_toolbar');
        $scope.expanded = false;
    };
    
    $scope.$on('image_list_update_event', function() {
        var images = Conference.images;
        var image_list = [];
        for (var image_id in images) {
            image_list.push(images[image_id]);
        }
        // sort image_list by timestamp
        image_list.sort(function(a,b) { return a.timestamp - b.timestamp } );
        $scope.image_list = image_list;
        $scope.$apply();
    });        
    
}

function SidebarCtrl($scope, conferenceService) {
    $scope.image = undefined;
    $scope.size = undefined;
    $scope.expanded = false;
    
    $scope.expand = function() {
        $(document).trigger('close_all_sidebars_internal');
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
            return {'background-color': "#555555"};
        }
        
        var backgroundUrl = "url(" + $scope.image.blur_url() + ")";
        var sizeString = $scope.size.width + "px " + $scope.size.height + "px";
        
        return {'background-image': backgroundUrl,
                'background-size': sizeString,
                'background-repeat': 'no-repeat',
                'background-attachment': 'fixed',
                };        
    }
    
    $scope.$on('close_sidebar_internal',  function() {
        // this is coming from angular, and doesn't need an $apply
        $scope.expanded = false;
    });
    
    $scope.$on('close_sidebar',  function() {
        // this is coming from outside angular and does need an $apply
        $scope.expanded = false;
        $scope.$apply();
    });
        
    // internal notification with no $apply        
    $scope.$on('image_change_internal', function() {
        $scope.image = conferenceService.displayed_image;
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

    // internal notification with no $apply
    $scope.$on('image_change_internal', function() {
        $scope.image = conferenceService.displayed_image;
    });
    
    $scope.$on('image_change', function() {
        log("controller on image_change");
        $scope.image = conferenceService.displayed_image;
        log("$scope.image.id is: " + $scope.image.id);
        $scope.$apply();
    });
}

ImageCtrl.$inject = ['$scope', 'conferenceService'];
SidebarCtrl.$inject = ['$scope', 'conferenceService'];
TopSidebarCtrl.$inject = ['$scope', '$controller', 'conferenceService'];