
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

conferenceModule.factory('conferenceService', function ($rootScope, $log) {
    var service = {};
    
    $(document).bind('upload_image', function(ev, image_data) {
        $log.info("conferenceService: received upload_image event");
        $rootScope.$broadcast('upload_image_data', image_data);
    });
    
    return service;
});

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

function PhotozzapCtrl($scope, $rootScope, $firebase, $firebaseSimpleLogin, $modal, $log, $window, $filter, $http, $q, $timeout, $location, conferenceService) {
    var DIMENSION_INCREMENT = 100;

    var DEFAULT_THUMBNAIL_DIMENSION = 250;    
    var DEFAULT_DIMENSION = 500;
    var DEFAULT_COMPRESSION = 75;
    var FULL_COMPRESSION = 90;
    
    $scope.temp_data = {};
    
    $scope.global_data = {};
    $scope.global_data.photo_index = 0;     
    $scope.global_data.photo_state_by_id = {};

    $scope.global_user_object = {}; // will be bound to the user's global object
    $scope.conference_user_object = {}; // will be bound to the user's conference object
    
    $scope.http_canceler = $q.defer();

    $scope.local_notifications = [];
    $scope.sorted_notifications = [];

    $scope.sorted_images = [];
    $scope.sorted_users = [];
    
    $scope.logged_in_and_ready = false;
    $scope.status_string = "loading";
    
    $scope.perform_setup_on_login = false;
    $scope.new_nickname = undefined;
   
    $scope.watching_photo_index = false;
    $scope.load_new_url_promise = undefined;
   
    $scope.init = function(firebase_base) {
        $scope.conf_key = $location.path().substring(1);
    
        $scope.firebase_base = firebase_base;
        var firebaseRef = new Firebase($scope.firebase_base);    
        $scope.login_obj = $firebaseSimpleLogin(firebaseRef);       

        $scope.login_obj.$getCurrentUser().then(function(user){
            $scope.status_string = "logging in";
            $log.info("getCurrentUser: ", user);
            if (user == null) {
                // login with generated nickname
                var randomNick = "Guest" + randomNumString(5);
                $scope.local_notifications.push("You have been logged in under the default username " + randomNick);
                $scope.perform_login(randomNick);
                // show login modal
                //$scope.open_login_modal();
            }        
        });        
    }
    
    $scope.firebase_references = function() {
        return $scope.compute_firebase_references({user_uid: $scope.login_obj.user.uid, 
                                                   conf_key: $scope.conf_key});
    }
   
    $scope.compute_firebase_references = function(inputs) {
        // inputs is {user_uid: "<>", conf_key: "<>"}
        
        var connection_state = $scope.firebase_base + "/.info/connected";
        var firebase_user = $scope.firebase_base + "users/" + inputs.user_uid;
        var conference = $scope.firebase_base + "conferences/" + inputs.conf_key;
        var conference_images = conference + "/images";
        var conference_comments = conference + "/comments";
        var conference_user = conference + "/users/" + inputs.user_uid;
        var connected = conference_user + "/connected";
        
        return {
            firebase_user: firebase_user,
            conference_user: conference_user,
            conference: conference,
            conference_images: conference_images,
            conference_comments: conference_comments,            
            connected: connected,
            connection_state: connection_state,
        };
    }
   
    $scope.initialize_user_bindings = function(user) {
        var references = $scope.firebase_references();
   
        var global_user_node = $firebase(new Firebase(references.firebase_user));
        var conference_user_node = $firebase(new Firebase(references.conference_user));
        
        var binding_done_promise = global_user_node.$bind($scope, "global_user_object").
        then(function(unbind) {
            $log.info("bound global_user_object");
            return conference_user_node.$bind($scope, "conference_user_object");
        });

        return binding_done_promise;
    }
   
    $scope.initialize_bindings = function() {
        var references = $scope.firebase_references();

        $scope.conference = $firebase(new Firebase(references.conference));
        $scope.images = $firebase(new Firebase(references.conference_images));
        $scope.comments = $firebase(new Firebase(references.conference_comments));
       
        $scope.logged_in_and_ready = true;
        
    }
   
    $scope.watch_connection_state = function() {
        var references = $scope.firebase_references();        
        var connected_ref = new Firebase(references.connection_state);
        
        connected_ref.on("value", function(snap) {
            if (snap.val() === true) {
                $log.info("connection state: connected");
                $scope.mark_user_connected();
            }
        }); 
    }
   
    $scope.watch_page_visibility = function() {
        if ($.support.pageVisibility) {
            $log.info("page visibility API supported");
            
            $(document).on({
                'show.visibility': function() {
                    $log.info("page visible");
                    $scope.conference_user_object.page_visible = true;
                    $scope.$apply();
                },
                'hide.visibility': function() {
                    $log.info("page not visible");
                    $scope.conference_user_object.page_visible = false;
                    $scope.$apply();
                }
            });            
        } else {
            $log.info("page visibility API not supported");
        }
    }
   
    $scope.mark_user_connected = function() {
        var references = $scope.firebase_references();
        
        var connected_ref = new Firebase(references.connected);
        connected_ref.onDisconnect().set(false);        
    
        $scope.conference_user_object.connected = true;
        $scope.conference_user_object.page_visible = true;
        $scope.conference_user_object.time_connected = new Date().getTime();
    }
    
    $scope.mark_user_disconnected = function() {
        $scope.conference_user_object.connected = false;
    }
   
    $rootScope.$on("$firebaseSimpleLogin:login", function(e, user) {
        $log.info("User " + user.id + " logged in");
        $scope.self_uid = user.uid;
        
        $scope.initialize_user_bindings(user).then(function() {
            $log.info("bound user bindings");
            $scope.watch_connection_state();
            $scope.watch_page_visibility();
    
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
        $scope.mark_user_disconnected();
        $scope.logged_in_and_ready = false;
        $scope.status_string = "logged out";
    });
    
   
    $scope.open_nick_change_modal = function() {
        $scope.modalInstance = $modal.open({templateUrl: "nick_change_modal.html",
                                            controller: PhotozzapNickChangeModalCtrl,
                                            scope: $scope
                                            });
    };    
   
    $scope.nickname_change = function(nickname) {
        $scope.global_user_object.nickname = nickname;
        $scope.conference_user_object.nickname = nickname;
    }
   
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
    
    $scope.$watch("conference.notifications", function(newValue, oldValue) {
        if ($scope.conference == undefined) {
            // cannot do anything yet
            return;
        }    
        var sorted_notifications_array = $filter('orderObjectByAndInsertId')($scope.conference.notifications, 'timestamp');
        $scope.sorted_notifications = $filter('filter')(sorted_notifications_array, function(elt) {
            var currentTimestamp = new Date().getTime();
            if (elt.user_key != $scope.self_uid &&  // don't display notifications for current user
                elt.timestamp + 10 > currentTimestamp) // don't display notifications older than 10s (in case they didn't get cleared)
            { 
                return true; 
            }
            return false;
        });
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
        $("html, body").animate({ scrollTop: 0 }, 400);
    }
 
    $scope.photo_index_from_id = function(image_id) {
        var photo_index = $scope.global_data.photo_state_by_id[image_id].photo_index;
        return photo_index;
    }
 
    $scope.$watch("full_params", function(newValue, oldValue) {
        $scope.check_and_load_new_url($scope.global_data.photo_index);
    }, true);
   
    $scope.check_and_load_new_url = function(photo_index) {
        
        var check_and_load_new_url_function = function(sorted_images, photo_index) {
            var image_data = $scope.sorted_images[photo_index];
            var loaded_params = $scope.global_data.photo_state_by_id[image_data.id].photo_loaded_params;
            if ($scope.params_greater(loaded_params, $scope.full_params)) {

                    if ($scope.load_new_url_promise != undefined) {
                        $timeout.cancel($scope.load_new_url_promise);
                        $scope.load_new_url_promise = undefined;
                    }
            
                    $scope.load_new_url_promise = $timeout(function() {
                            $log.info("loading new URL, loaded_params: ", loaded_params, " full_params: ", $scope.full_params);
                    
                            // put new url in map - angular will load it automatically
                            $scope.global_data.photo_state_by_id[image_data.id].photo_loaded_params = clone($scope.full_params);
                            $scope.global_data.photo_state_by_id[image_data.id].photo_hires_url = $scope.cloudinary_photo_full_url(image_data);
                            $scope.load_new_url_promise = undefined;
                        }, 2000);
            
                } else {
                    $log.info("not loading new URL, loaded_params: ", loaded_params, " full_params: ", $scope.full_params);
                }
        }
        
        if ($scope.sorted_images == undefined || $scope.sorted_images.length == 0) {
            // need this one-off handler for the first time a photo is loaded
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
        if (image_id == undefined) {
            return "holder.js/100x100/text:na";
        }
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

function ImageCtrl($scope) {
}


function ChatCtrl($scope, $log, $filter) {
    $scope.submit_comment = function() {
        $log.info("submit_comment: " + $scope.comment_text);
        $scope.comments.$add({user_id: $scope.login_obj.user.uid,
                              nickname: $scope.conference_user_object.nickname,
                              image_id: $scope.conference_user_object.viewing_image_id,
                              time_added: new Date().getTime(),
                              text: $scope.comment_text}); 
        $scope.comment_text = "";                              
    }
    
    $scope.$watch("conference.comments", function(newValue, OldValue) {
        $log.info("watch conference.comments");
        if ($scope.conference == undefined) {
            // cannot do anything yet
            return;
        }
        var sorted_comments =  $filter('orderObjectByAndInsertId')($scope.conference.comments, 'time_added');
        
        var process_group = function(current_group, comment_groups) {
            var id_list = $.map(current_group.comments, function(obj, i){ return obj.id; });
            var id_list_str =  id_list.join("_");
            current_group.id_list = id_list_str;
            comment_groups.push(current_group);        
        };
        
        // sort in groups
        var comment_groups = [];
        var current_image_id = undefined;
        var current_group = undefined;
        var cumulative_comment_length = 0;
        var cumulative_comment_num = 0;
        for(var i in sorted_comments) {
            var comment = sorted_comments[i];        
            if (current_image_id != comment.image_id || cumulative_comment_length > 250 || cumulative_comment_num > 7 ) {
                // process old group
                if (current_group != undefined) {
                    process_group(current_group, comment_groups);
                }
                // create new group
                current_group = {image_id: comment.image_id,
                                 comments: []};   
                current_image_id = comment.image_id;
                cumulative_comment_length = 0;
                cumulative_comment_num = 0;
            }
            current_group.comments.push(comment);
            cumulative_comment_length += comment.text.length;
            cumulative_comment_num += 1;
        }
        if (current_group.comments.length > 0 ) {
            process_group(current_group, comment_groups);
        }
        
        $scope.comment_groups = comment_groups;
        
        /*
        var num_columns = 3;
        // $scope.comment_groups = comment_groups;
        
        var column_groups = [[], [], []];
        for(var i in comment_groups) {
            var comment_group = comment_groups[i];
            column_groups[i % num_columns].push(comment_group);
        }
        $scope.column_groups = column_groups;\
        */
       
    }, true);    
}