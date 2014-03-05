
var conferenceModule = angular.module('conferenceModule', ['ngAnimate', "firebase", 'angular-carousel', 'ui.bootstrap']);

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

conferenceModule.factory('conferenceService', function ($rootScope) {
    var service = {};
    
    service.image_data = Conference.image_data;
    
    service.sidebars_open_map = {};
    
    service.show_interface = true;
    
    service.menu_visible = true;
    
    service.register_image_change = function(image) {
        service.image_data.current_image = image;
        service.recalc_image_data();
    };
    
    service.recalc_image_data = function() {
        // make a backup copy of prev and next image ids, we want to know if they changed
        var backup_prev_image_id = undefined;
        var backup_next_image_id = undefined;
        var current_prev_image_id = undefined;
        var current_next_image_id = undefined;
        if (Conference.image_data.prev_image != undefined) {
            backup_prev_image_id = Conference.image_data.prev_image.id;
        }
        if (Conference.image_data.next_image != undefined) {
            backup_next_image_id = Conference.image_data.next_image.id;
        }
    
        // go over images and sort them
        var images = Conference.images;
        var image_list = [];
        for (var image_id in images) {
            image_list.push(images[image_id]);
        }
        // sort image_list by timestamp
        image_list.sort(function(a,b) { return a.timestamp - b.timestamp } );
        service.image_data.image_list = image_list;
        var image_id_to_num = {};
        var i = 0;
        for (var image_index in image_list) {
            var image = image_list[image_index];
            image_id_to_num[image.id] = i;
            i++;
        }        
        
        service.image_data.num_images = image_list.length;
        service.image_data.current_index = 0;
        if( service.image_data.current_image != undefined &&
            image_id_to_num[ service.image_data.current_image.id ] != undefined ) {
            service.image_data.current_index = image_id_to_num[ service.image_data.current_image.id ];
        }
        
        service.image_data.swipe_images_list = [];
        
        if( service.image_data.current_index > 0 ) {
            // previous available
            service.image_data.prev_image = image_list[ service.image_data.current_index - 1];
            service.image_data.swipe_images_list.push(service.image_data.prev_image);
            current_prev_image_id = service.image_data.prev_image.id;
        } else {
            // previous not available
            service.image_data.prev_image = undefined;
        }
        
        if ( service.image_data.current_image != undefined ) {
            service.image_data.swipe_images_list.push(service.image_data.current_image);
        }
        
        if( service.image_data.current_index < service.image_data.num_images - 1 ) {
            // next available
            service.image_data.next_image = image_list[ service.image_data.current_index + 1];
            service.image_data.swipe_images_list.push(service.image_data.next_image);
            current_next_image_id = service.image_data.next_image.id;
        } else {
            // next not available
            service.image_data.next_image = undefined;
        }
        
        log("recalc_image_data, swipe_images_list.length: " + service.image_data.swipe_images_list.length);
        
        // are the previous or next images changing ? if so, rebuild swipe container
        if (backup_prev_image_id != current_prev_image_id ||
            backup_next_image_id != current_next_image_id) {
            log("prev_image or next_image changed, rebuild_swipe_container");
            rebuild_swipe_container();
        }
        
        Conference.image_data = service.image_data;
        
    };
    
    service.display_image_event = function(ev, image) {
        service.register_image_change(image);
        $rootScope.$broadcast('image_change');
    };
    
    service.display_image_internal_event = function(ev, image) {
        service.register_image_change(image);
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
        service.recalc_image_data();
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
    
    service.set_interface_visible_event = function(ev, value) {
        if( service.menu_visible && value == false ) {
            // ignore this update
            return;
        }
        service.show_interface = value;
        $rootScope.$broadcast('interface_visible_update');
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
    
    $(document).bind('set_interface_visible', service.set_interface_visible_event);
    
    $(document).bind('show_intro', function(ev) {
        $rootScope.$broadcast('show_intro_event');
    });
    
    $(document).bind('toggle_menu_visible', function(ev) {
        service.menu_visible = ! service.menu_visible;
        $rootScope.$broadcast('menu_visible_event');
    });
    
    $(document).bind('upload_image', function(ev, image_data) {
        $rootScope.$broadcast('upload_image_data', image_data);
    });
    
    return service;
});

function PhotozzapLoginModalCtrl($scope, $rootScope, $modalInstance, $log) {
    $scope.user_object = {};
    
    $scope.login = function() {
        $scope.perform_login($scope.user_object.nickname);
        $modalInstance.dismiss('close');
    }
}

function PhotozzapCtrl($scope, $rootScope, $firebase, $firebaseSimpleLogin, $modal, $log, $window, $filter, $http, $q, $timeout) {
    var DIMENSION_INCREMENT = 100;

    var DEFAULT_THUMBNAIL_DIMENSION = 250;    
    var DEFAULT_DIMENSION = 640;
    var DEFAULT_COMPRESSION = 75;
    var FULL_COMPRESSION = 90;
    
    $scope.global_data = {};
    $scope.global_data.photo_index = 0;     
    $scope.global_data.photo_state_by_id = {};

    $scope.global_user_object = {}; // will be bound to the user's global object
    $scope.conference_user_object = {}; // will be bound to the user's conference object
    
    $scope.http_canceler = $q.defer();
    
    $scope.firebase_base = "https://fiery-fire-5557.firebaseio.com/";
    $scope.firebase_users = $scope.firebase_base + "users/";
    var firebaseRef = new Firebase($scope.firebase_base);

    $scope.sorted_images = [];
    $scope.sorted_users = [];
    
    $scope.logged_in_and_ready = false;
    $scope.status_string = "loading";
    
    $scope.perform_setup_on_login = false;
    $scope.new_nickname = undefined;
    $scope.login_obj = $firebaseSimpleLogin(firebaseRef);
   
    $scope.watching_photo_index = false;
   
    $scope.initialize_user_bindings = function(user) {
        var global_user_path = $scope.firebase_users + user.uid;
        var conference_user_path = $scope.firebase_base + "conferences/" + PHOTOZZAP_CONF_KEY + "/users/" + user.uid;
        var conference_user_connected_path = conference_user_path + "/connected";
    
        var global_user_node = $firebase(new Firebase(global_user_path));
        var conference_user_node = $firebase(new Firebase(conference_user_path));
        
        var connected_ref = new Firebase(conference_user_connected_path);
        connected_ref.onDisconnect().set(false);
        
        $log.info("binding to [", global_user_path, "], [", conference_user_path, "]");
        $log.info("connected_ref path: [", conference_user_connected_path, "]");
        
        var binding_done_promise = global_user_node.$bind($scope, "global_user_object").
        then(function(unbind) {
            $log.info("bound global_user_object");
            return conference_user_node.$bind($scope, "conference_user_object");
        });

        return binding_done_promise;
    }
   
    $scope.initialize_bindings = function() {
        var conference_path_base = $scope.firebase_base + "conferences/" + PHOTOZZAP_CONF_KEY;
        var conference_images_path = conference_path_base + "/images";
    
        $scope.conference = $firebase(new Firebase(conference_path_base));
        $scope.images = $firebase(new Firebase(conference_images_path));
       
        $scope.logged_in_and_ready = true;
        
    }
   
    $rootScope.$on("$firebaseSimpleLogin:login", function(e, user) {
        $log.info("User " + user.id + " logged in");
        
        $scope.initialize_user_bindings(user).then(function() {
            $log.info("bound user bindings");
            $scope.conference_user_object.connected = true;
            $scope.conference_user_object.time_connected = new Date().getTime();
            if($scope.perform_setup_on_login) {
                $scope.global_user_object.nickname = $scope.new_nickname;
                $scope.conference_user_object.nickname = $scope.new_nickname;
            } else {
                // see what the user has in his global object, and copy from there
                // $log.info("global_user_object.nickname is: ", $scope.global_user_object.nickname);
                $scope.conference_user_object.nickname = $scope.global_user_object.nickname;
            }
            
            $scope.initialize_bindings();            
        });

    });
    
    $rootScope.$on("$firebaseSimpleLogin:logout", function() {
        $scope.logged_in_and_ready = false;
        $scope.status_string = "logged out";
    });
    
    $scope.login_obj.$getCurrentUser().then(function(user){
        $scope.status_string = "logging in";
        $log.info("getCurrentUser: ", user);
        if (user == null) {
            // show login modal
            $scope.open_login_modal();
        }        
    });
    
    $scope.open_login_modal = function() {
        $log.info("open_login_modal");
        $scope.modalInstance = $modal.open({templateUrl: "login_modal.html",
                                            controller: PhotozzapLoginModalCtrl,
                                            scope: $scope
                                            });
    };    
   
    $scope.perform_login = function(nickname) {
        $log.info("perform_login with nickname " + nickname);
        $scope.perform_setup_on_login = true;
        $scope.new_nickname = nickname;
        $scope.login_obj.$login('anonymous', {rememberMe: true});        
    }
   
    $scope.logout = function() {
        $log.info("logout");
        $scope.login_obj.$logout();
    }
   
    $scope.$on('upload_image_data', function(event, data){ 
        $log.info("upload_image_data, cloudinary id: " + data.id);
        $scope.images.$add({id: data.id,
                            time_added: new Date().getTime()});
    });
    
    angular.element($window).bind('resize', function () {
        $scope.resize_handler();
    });
    
    $scope.round_dimension = function(real_dimension) {
        return Math.ceil(real_dimension / DIMENSION_INCREMENT) * DIMENSION_INCREMENT;
    }

    $scope.window_dimensions = {width: $(window).width(),
                                height: $(window).height()};
    
    $scope.default_params = {width: DEFAULT_DIMENSION,
                             height: DEFAULT_DIMENSION,
                             quality: DEFAULT_COMPRESSION};
    $scope.full_params = {width: $scope.round_dimension($(window).width()),
                          height: $scope.round_dimension($(window).height()),
                          quality: FULL_COMPRESSION};
    
    $scope.resize_handler = function() {
        var new_width = $(window).width();
        var new_height = $(window).height();

        var pixelRatio = 1;
        if( window.devicePixelRatio != undefined ) {
            pixelRatio = window.devicePixelRatio;
        }
        
        $scope.full_params.width = $scope.round_dimension(new_width * pixelRatio);
        $scope.full_params.height = $scope.round_dimension(new_height * pixelRatio);
        
        if (new_width == $scope.window_width && 
            new_height - $scope.window_height < 60) {
            // don't do anything, window resize is due to user scrolling down
        } else {
            $scope.window_dimensions.width = $(window).width();
            $scope.window_dimensions.height = $(window).height();   
            $scope.$apply();
        }
    }
    
    // return true if new params have at least one dimension greater
    $scope.params_greater = function(old_params, new_params) {
        if (new_params.width > old_params.width ||
            new_params.height > old_params.height ||
            new_params.quality > old_params.quality) {
                return true;
            }
        return false;
    }
    
    $scope.$watch("conference.images", function(newValue, OldValue) {
        if ($scope.conference == undefined) {
            // cannot do anything yet
            return;
        }
        $log.info("change in images, sorting");
        $scope.sorted_images =  $filter('orderObjectBy')($scope.conference.images, 'time_added');
        angular.forEach($scope.sorted_images, function(image, index){
            if (this[image.id] == undefined) {
                this[image.id] = {photo_loaded_params: clone($scope.default_params),
                                  photo_url: $scope.cloudinary_photo_default_url(image),
                                  thumbnail_url: $scope.cloudinary_thumbnail_url(image),
                                  photo_index: index};
            }
        }, $scope.global_data.photo_state_by_id);
        
        if (! $scope.watching_photo_index && $scope.sorted_images.length > 0) {
            $scope.start_watch_photo_index();
            $scope.watching_photo_index = true;
        }
        
    }, true);

    $scope.$watch("conference.users", function(newValue, OldValue) {
        if ($scope.conference == undefined) {
            // cannot do anything yet
            return;
        }

        var sorted_users_array =  $filter('orderObjectByAndInsertId')($scope.conference.users, 'time_added');
        $scope.sorted_users = $filter('filter')(sorted_users_array, {connected: true});
        
    }, true);
    
    $scope.start_watch_photo_index = function() {
        $scope.$watch("global_data.photo_index", function(newValue, oldValue) {
            $log.info("global_data.photo_index changed: " + newValue);
            // do we need to load a new photo ?
            $scope.check_and_load_new_url(newValue);
            
            // update user object on firebase
            $scope.conference_user_object.viewing_image_id = $scope.sorted_images[newValue].id;
            
        });
    }
 
    $scope.show_image = function(image_id) {
        var photo_index = $scope.global_data.photo_state_by_id[image_id].photo_index;
        $scope.global_data.photo_index = photo_index;
    }
 
    $scope.$watch("full_params", function(newValue, oldValue) {
        $scope.check_and_load_new_url($scope.global_data.photo_index);
    }, true);
   
    $scope.check_and_load_new_url = function(photo_index) {
        
        var check_and_load_new_url_function = function(sorted_images, photo_index) {
            var image_data = $scope.sorted_images[photo_index];
            var loaded_params = $scope.global_data.photo_state_by_id[image_data.id].photo_loaded_params;
            if ($scope.params_greater(loaded_params, $scope.full_params)) {
                    $log.info("loading new URL, loaded_params: ", loaded_params, " full_params: ", $scope.full_params);
                    // cancel existing http request and configure new promise
                    $scope.http_canceler.resolve();
                    $scope.http_canceler = $q.defer();
                    // load new URL
                    var http_get_config = {method: 'GET',
                                           url: $scope.cloudinary_photo_full_url(image_data),
                                           timeout: $scope.http_canceler.promise,
                                           image_id: image_data.id,
                                           loaded_params: clone($scope.full_params)};
                    $http(http_get_config).
                    success(function(data, status, headers, config) {
                        $log.info("successfully loaded full res for image id: " + config.image_id);
                        $scope.global_data.photo_state_by_id[config.image_id].photo_loaded_params = config.loaded_params;
                        $scope.global_data.photo_state_by_id[config.image_id].photo_url = config.url;
                    }).
                    error(function(data, status, headers, config) {
                        $log.info("aborted load for  " + config.image_id);
                    });
                } else {
                    $log.info("not loading new URL, loaded_params: ", loaded_params, " full_params: ", $scope.full_params);
                }
        }
        
        if ($scope.sorted_images == undefined || $scope.sorted_images.length == 0) {
            // run 
            var watch_handler = $scope.$watch("sorted_images", function(new_value) {
                if ($scope.sorted_images != undefined && $scope.sorted_images.length > 0) {
                    $log.info("sorted_images changed, can run check_and_load_new_url_function: ", $scope.sorted_images);
                    check_and_load_new_url_function($scope.sorted_images, photo_index);
                    watch_handler();
                }
            });
        } else {
            // run directly
            check_and_load_new_url_function($scope.sorted_images, photo_index);
        }
    

    }
    
    $scope.cloudinary_photo_full_url = function(image_data) {
        return $.cloudinary.url(image_data.id + ".jpg", {crop: 'fit', 
                                                         width: $scope.full_params.width, 
                                                         height: $scope.full_params.height,
                                                         quality: $scope.full_params.quality});
    };
   
    $scope.cloudinary_photo_default_url = function(image_data) {
        return $.cloudinary.url(image_data.id + ".jpg", {crop: 'fit', 
                                                         width: $scope.default_params.width, 
                                                         height: $scope.default_params.height,
                                                         quality: $scope.default_params.quality});
    };
    
    $scope.cloudinary_thumbnail_url = function(image_id) {
        return $.cloudinary.url(image_id + ".jpg", {crop: 'fill', 
                                                         width: DEFAULT_THUMBNAIL_DIMENSION, 
                                                         height: DEFAULT_THUMBNAIL_DIMENSION,
                                                         quality: DEFAULT_COMPRESSION,
                                                         sharpen: 400});
    };    
}


function ThumbnailsCtrl($scope, $log) {
    $scope.thumbnail_groups = [];
    $scope.num_thumbnails = 3;
    $scope.thumbnails_width = 33;
    $scope.thumbnail_group_index = 0;

    $scope.init = function(watch_expression)
    {    
        $scope.watch_expression = watch_expression;
        $scope.$watch($scope.watch_expression, $scope.watch_handler, true); 
    }
    
    $scope.refresh_thumbnail_groups = function() {
        $log.info("change in ", $scope.watch_expression , " generating thumbnail groups");
        $scope.thumbnail_groups = $scope.generate_thumbnail_groups();
        $log.info("thumbnail_groups: ", $scope.thumbnail_groups);
        if ($scope.thumbnail_group_index >= $scope.thumbnail_groups.length &&
            $scope.thumbnail_group_index > 0) {
            // the index is too far ahead, there aren't enough groups
            $log.info("changing thumbnail_group_index as there aren't enough groups");
            $scope.thumbnail_group_index = $scope.thumbnail_groups.length - 1;
        }
    };
    
    $scope.refresh_num_thumbnails = function() {
        var window_width = $scope.window_dimensions.width;
    
        if (window_width > 1500) {
            $scope.num_thumbnails = 10;
        } else if (window_width > 1300) {
            $scope.num_thumbnails = 9;
        } else if (window_width > 1100) {
            $scope.num_thumbnails = 8;            
        } else if (window_width > 1024) {
            $scope.num_thumbnails = 7;            
        } else if (window_width > 770) {
            $scope.num_thumbnails = 6;
        } else if (window_width > 500) {
            $scope.num_thumbnails = 5;
        } else if (window_width > 400) {
            // iphone4 landscape
            $scope.num_thumbnails = 4;
        } else if (window_width >= 320) {
            // iphone4 portrait
            $scope.num_thumbnails = 3;
        } else {
            $scope.num_thumbnails = 2;
        }
        var temp_width = (100 / $scope.num_thumbnails) * 10.0;
        var int_width = Math.floor(temp_width);
        $scope.thumbnails_width = int_width / 10.0;
        $log.info("refresh_num_thumbnails: num_thumbnails: " + $scope.num_thumbnails +
                  " thumbnails_width: " + $scope.thumbnails_width);
    };
    $scope.refresh_num_thumbnails();

    $scope.watch_handler = function(newValue, OldValue) {
        $scope.refresh_thumbnail_groups();
    };
    
    $scope.$watch("window_dimensions.width", function(newValue, oldValue) {
        $scope.refresh_num_thumbnails();
        $scope.refresh_thumbnail_groups();
    });
    
    // return thumbnail groups which can be used with angular-carousel
    $scope.generate_thumbnail_groups = function() {
        var result = [];
        var obj_array = $scope[$scope.watch_expression];
        if (obj_array == undefined) {
            return [];
        }
        var current_group = [];
        for (var i = 0; i < obj_array.length; i++) {
            current_group.push(obj_array[i]);
            if ((i + 1) % $scope.num_thumbnails == 0) {
                var id_list = $.map(current_group, function(obj, i){ return obj.id; });
                result.push({id_list: id_list.join("_"),
                             objs: current_group});
                current_group = [];
            }
        }
        if (current_group.length > 0 ) {
            var id_list = $.map(current_group, function(obj, i){ return obj.id; });
            result.push({id_list: id_list.join("_"),
                         objs: current_group});
        }
        
        $log.info("num groups: " + result.length);
        
        return result;
    };
}


function TopSidebarCtrl($scope, $controller, conferenceService) {
    $controller('SidebarCtrl', {$scope: $scope, conferenceService: conferenceService});
    
    
    $scope.icon_class_state = function() {
        if (! $scope.interface_visible || ! $scope.menu_visible) {
            return "hidden";
        } else if ($scope.other_sidebars_expanded) {
            return "other-sidebars-expanded";
        }
        return "visible";
    };        
}

function NextSidebarCtrl($scope, $controller, conferenceService) {
    $controller('SidebarCtrl', {$scope: $scope, conferenceService: conferenceService});
    
    $scope.next_enabled = function() {
        return $scope.image_data.next_image != undefined;
    }    
    
    $scope.next = function() {
        if ( $scope.next_enabled() ) {
            transition_next(null);
            $scope.select_image( $scope.image_data.next_image.id );
        }    
    }    
}

function PrevSidebarCtrl($scope, $controller, conferenceService) {
    $controller('SidebarCtrl', {$scope: $scope, conferenceService: conferenceService});
    
    $scope.prev_enabled = function() {
        return $scope.image_data.prev_image != undefined;
    }
    
    $scope.prev = function() {
        if ( $scope.prev_enabled() ) {
            transition_prev(null);
            $scope.select_image( $scope.image_data.prev_image.id );
        }
    }
}

function IntroSidebarCtrl($scope, $controller, $timeout, conferenceService) {
    $controller('SidebarCtrl', {$scope: $scope, conferenceService: conferenceService});
    $scope.shown = false;

    $scope.dont_show = function() {
        $scope.shown = false;    
    };
    
    $scope.$on('show_intro_event', function(){ 
        $scope.shown = true;
        $timeout($scope.dont_show, 5000);
        $scope.$apply();
    });    
    
}

// contains multiple sidebars which can be expanded / collapsed
function ToolSidebarCtrl($scope, $controller, conferenceService) {
    $controller('SidebarCtrl', {$scope: $scope, conferenceService: conferenceService});
    
    $scope.icon_class_state = function() {
        if (! $scope.interface_visible || ! $scope.menu_visible) {
            return "hidden";
        } else if ($scope.other_sidebars_expanded) {
            return "other-sidebars-expanded";
        }
        return "visible";
    };    
    
}

function MenuSidebarCtrl($scope, $controller, conferenceService) {
    $controller('SidebarCtrl', {$scope: $scope, conferenceService: conferenceService});
    
    $scope.toggle = function() {
        $(document).trigger('toggle_menu_visible');
    };
}

function SidebarCtrl($scope, conferenceService) {
    $scope.image = undefined;
    $scope.size = undefined;
    $scope.other_sidebars_expanded = false;
    $scope.interface_visible = true;
    $scope.menu_visible = true;
    $scope.image_data = conferenceService.image_data;    
    $scope.expanded_sidebar = {};
    
    $scope.init = function(name) {
        $scope.name = name;
    };
    
    $scope.toggle_sidebar = function(name) {
        log("toggle_sidebar " + name);
        if ($scope.is_expanded(name)) {
            $scope.collapse_sidebar(name);
        } else {
            $scope.expand_sidebar(name);
        }
    };
    
    $scope.expand_sidebar = function(name) {
        $(document).trigger('close_all_sidebars_internal');
        $scope.expanded_sidebar[name] = true;
        $(document).trigger('report_sidebar_status', {name: name, expanded: true});
    };
    
    $scope.collapse_sidebar = function(name) {
        $scope.expanded_sidebar[name] = false;
        $(document).trigger('report_sidebar_status', {name: name, expanded: false});
    };
    
    $scope.is_expanded = function(name) {
        if ($scope.expanded_sidebar[name] == undefined ||
            $scope.expanded_sidebar[name] == false) {
            return false;
        }
        return true;    
    };
    
    $scope.sidebar_class_state = function(name) {
        if (! $scope.is_expanded(name)) {
            return "collapsed";
        }
        return "expanded";
    };
    
    $scope.icon_class_state = function() {
        if (! $scope.interface_visible ) {
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
    
    $scope.collapse_all_sidebars = function() {
        for (var sidebar in $scope.expanded_sidebar) {
            $scope.collapse_sidebar(sidebar);
        }
    }
    
    $scope.select_image = function(image_id) {
        log("selected image: " + image_id);
        var image = Conference.images[image_id];
        $(document).trigger('not_following_user');
        $(document).trigger('show_current_image', false);
        $(document).trigger('display_image_internal', image);
        $scope.collapse_all_sidebars();
    };    
    
    $scope.$on('close_sidebar_internal',  function() {
        // this is coming from angular, and doesn't need an $apply
        $scope.collapse_all_sidebars();
    });
    
    $scope.$on('close_sidebar',  function() {
        // this is coming from outside angular and does need an $apply
        $scope.collapse_all_sidebars();
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
            if(conferenceService.sidebars_open_map[name] == true) {
                result = true;
            }
        }
        $scope.other_sidebars_expanded = result;        
    });    
 
    // interface_visible_update
    $scope.$on('interface_visible_update', function(){ 
        $scope.interface_visible = conferenceService.show_interface;
        $scope.$apply();
    });
    
    $scope.$on('menu_visible_event', function() {
        $scope.menu_visible = conferenceService.menu_visible;
    });
    
    $scope.$on('image_list_update_event', function() {
        $scope.image_data = conferenceService.image_data;
        $scope.$apply();
    });        
    
    // internal notification with no $apply        
    $scope.$on('image_change_internal', function() {
        $scope.image = conferenceService.image_data.current_image;
        $scope.image_data = conferenceService.image_data;
    });            
        
    $scope.$on('image_change', function() {
        $scope.image = conferenceService.image_data.current_image;
        $scope.image_data = conferenceService.image_data;
        $scope.$apply();
    });            
 
}

function ImageCtrl($scope, conferenceService) {
    $scope.image_data = conferenceService.image_data;

    $scope.showing_image = function() {
        return (Object.keys($scope.processed_images).length > 0 );
    };
    
    $scope.image_src = function() {
        result = "";
        if(Object.keys($scope.processed_images).length > 0 ) {
            var first_key = Object.keys($scope.processed_images)[0];
            result = $scope.processed_images[first_key].url;
        }
        /*
        if( $scope.showing_image() ) {
            result = $scope.image_data.current_image.image_url();
        }
        */
        return result;
    };    
    
    $scope.blur_src = function() {
        result = "";
        if( $scope.showing_image() ) {
            result = $scope.image_data.current_image.blur_url();
        }
        return result;
    };
    
    // internal notification with no $apply
    $scope.$on('image_change_internal', function() {
        $scope.image_data = conferenceService.image_data;
    });
    
    $scope.$on('image_change', function() {
        log("controller on image_change");
        $scope.image_data = conferenceService.image_data;
        $scope.$apply();
    });
}

ImageCtrl.$inject = ['$scope', 'conferenceService'];
SidebarCtrl.$inject = ['$scope', 'conferenceService'];
TopSidebarCtrl.$inject = ['$scope', '$controller', 'conferenceService'];
ToolSidebarCtrl.$inject = ['$scope', '$controller', 'conferenceService'];
MenuSidebarCtrl.$inject = ['$scope', '$controller', 'conferenceService'];
IntroSidebarCtrl.$inject = ['$scope', '$controller', '$timeout', 'conferenceService'];