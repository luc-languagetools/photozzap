
var conferenceModule = angular.module('conferenceModule', []);
conferenceModule.factory('conferenceService', function ($rootScope) {
    var service = {};
    
    service.display_image = undefined;
    
    service.sidebars_open_map = {};
    
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
        service.report_all_sidebars_closed();
        $rootScope.$broadcast('close_sidebar');
    }
    
    service.close_all_sidebars_internal_event = function(ev) {
        service.report_all_sidebars_closed();
        $rootScope.$broadcast('close_sidebar_internal');
    }    
    
    service.image_list_update_event = function(ev) {
        $rootScope.$broadcast('image_list_update_event');
    }

    service.sidebar_status_event = function(ev, value) {
        service.sidebars_open_map[value.name] = value.expanded;
        $rootScope.$broadcast('sidebar_status_update');
    }
    
    service.report_all_sidebars_closed = function() {
        for( var name in service.sidebars_open_map) {
            service.sidebars_open_map[name] = false;
        }
        $rootScope.$broadcast('sidebar_status_update');
    }
    
    $(document).bind('loaded_highres', service.loaded_highres_event);
    
    $(document).bind('display_image', service.display_image_event);
    
    $(document).bind('display_image_internal', service.display_image_internal_event);
    
    $(document).bind('resize_image', service.resize_image_event);
    
    $(document).bind('close_all_sidebars', service.close_all_sidebars_event);
    
    $(document).bind('close_all_sidebars_internal', service.close_all_sidebars_internal_event);
    
    $(document).bind('new_image', service.image_list_update_event);
    
    $(document).bind('new_comment', service.image_list_update_event);
    
    $(document).bind('report_sidebar_status', service.sidebar_status_event);
    
    return service;
});


function TopSidebarCtrl($scope, $controller, conferenceService) {
    $controller('SidebarCtrl', {$scope: $scope, conferenceService: conferenceService});
    $scope.image_list = [];
    $scope.image_id_to_num = {};
    $scope.image = undefined;
    
    $scope.num_images = function() {
        return $scope.image_list.length;
    };
    
    $scope.current_image_index = function() {
        if( $scope.image == undefined ) {
            return 0;
        }
        if( $scope.image_id_to_num[$scope.image.id] == undefined ) {
            return 0;
        }
        return $scope.image_id_to_num[$scope.image.id];    
    }
    
    // human-readable function - add +1
    $scope.currently_showing = function() {
        return $scope.current_image_index() + 1;
    },
    
    $scope.prev_enabled = function() {
        if ( $scope.current_image_index() > 0 ) {
            return true;
        }
        return false;
    },
    
    $scope.next_enabled = function() {
        if ( $scope.current_image_index() < $scope.num_images() - 1 ) {
            return true;
        }
        return false;
    }
    
    $scope.prev = function() {
        if ( $scope.prev_enabled() ) {
            $scope.select_image( $scope.image_list[ $scope.current_image_index() - 1 ].id );
        }
    },
    
    $scope.next = function() {
        if ( $scope.next_enabled() ) {
            $scope.select_image( $scope.image_list[ $scope.current_image_index() + 1 ].id );
        }    
    },
    
    $scope.select_image = function(image_id) {
        log("selected image: " + image_id);
        var image = Conference.images[image_id];
        $(document).trigger('not_following_user');
        $(document).trigger('show_current_image', false);
        $(document).trigger('display_image_internal', image);
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
        $scope.image_id_to_num = {};
        var i = 0;
        for (var image_index in image_list) {
            var image = image_list[image_index];
            $scope.image_id_to_num[image.id] = i;
            i++;
        }
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
    
   
}

function SidebarCtrl($scope, conferenceService) {
    $scope.image = undefined;
    $scope.size = undefined;
    $scope.expanded = false;
    $scope.other_sidebars_expanded = false;
    $scope.icon_visible = true;
    
    $scope.init = function(name) {
        $scope.name = name;
    };
    
    $scope.expand = function() {
        $(document).trigger('close_all_sidebars_internal');
        $scope.expanded = true;
        $(document).trigger('report_sidebar_status', {name: $scope.name, expanded: $scope.expanded});
    };
    
    $scope.collapse = function() {
        log("SidebarCtrl.collapse");
        $scope.expanded = false;
        $(document).trigger('report_sidebar_status', {name: $scope.name, expanded: $scope.expanded});
    };
    
    $scope.class_state = function() {
        if ( $scope.expanded == true) {
            return "expanded";
        }
        return "collapsed";
    };
    
    $scope.icon_class_state = function() {
        if (! $scope.icon_visible ) {
            return "hidden";
        } else if ($scope.other_sidebars_expanded) {
            return "other-sidebars-expanded";
        }
        return "visible";
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
    
    $scope.$on('sidebar_status_update', function() {
        var result = false;        
        for (var name in conferenceService.sidebars_open_map) {
            if (name != $scope.name) {
                if(conferenceService.sidebars_open_map[name] == true) {
                    result = true;
                }
            }
        }
        $scope.other_sidebars_expanded = result;        
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