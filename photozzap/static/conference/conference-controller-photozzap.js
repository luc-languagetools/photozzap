function PhotozzapCtrl($scope, $rootScope, $firebase, $firebaseSimpleLogin, $modal, $log, $window, $filter, $http, $q, $timeout, $location, $timeout, conferenceService) {
    var DIMENSION_INCREMENT = 100;

    var DEFAULT_THUMBNAIL_DIMENSION = 250;    
    var DEFAULT_THUMBNAIL_SHORT_DIMENSION = 200;
    var DEFAULT_DIMENSION = 500;
    var DEFAULT_COMPRESSION = 75;
    var FULL_COMPRESSION = 90;
    
    $scope.temp_data = {};
    
    $scope.global_data = {};
    $scope.global_data.photo_index = 0;     
    $scope.global_data.photo_state_by_id = {};

    $scope.http_canceler = $q.defer();

    $scope.show_default_nickname_notification = false;
    $scope.sorted_notifications = [];

    $scope.sorted_images = [];
    $scope.sorted_users = [];
    
    $scope.logged_in_and_ready = false;
    $scope.status_string = "loading";
    
    $scope.perform_setup_on_login = false;
    $scope.new_nickname = undefined;
   
    $scope.watching_photo_index = false;
    $scope.load_new_url_promise = undefined;
    
    $scope.watch_followed_user_handle = undefined;
    $scope.followed_user_image_id = undefined;
   
    $scope.init = function(firebase_base, server_name) {
        $scope.conf_key = $location.path().substring(1);
    
        $scope.firebase_base = firebase_base;
        $scope.server_name = server_name;
        
        // call the resize method once after initialization
        $timeout($scope.retrieve_window_dimensions, 3000);
        
        var temp_references = $scope.compute_firebase_references({conf_key: $scope.conf_key,
                                                                  server_name: $scope.server_name});
        // look at the conference, is it closed ?
        $scope.temp_conference_node = $firebase(new Firebase(temp_references.conference));
        $scope.temp_conference_node.$on('loaded', function() {
            // is it closed ?
            if ($scope.temp_conference_node.status == "closed") {
                // no need to load any more data
                $scope.conference = {status: "closed"};
            } else {
                if ($scope.temp_conference_node.servername != $scope.server_name) {
                    // redirect to other server
                    $log.info("need to redirect to other server: ", $scope.temp_conference_node.permanent_url);
                    $window.location.href = $scope.temp_conference_node.permanent_url;
                    
                } else {
                    $scope.temp_conference_node.$off('loaded');
                    $scope.temp_conference_node = undefined;
                
                    // proceed to rest of initialization
                    var firebaseRef = new Firebase($scope.firebase_base);    
                    $scope.login_obj = $firebaseSimpleLogin(firebaseRef);       

                    $scope.login_obj.$getCurrentUser().then(function(user){
                        $scope.status_string = "logging in";
                        $log.info("getCurrentUser: ", user);
                        if (user == null) {
                            // login with generated nickname
                            var randomNick = "Guest" + randomNumString(5);
                            $scope.perform_login(randomNick);
                            $scope.show_default_nickname_notification = true;
                            $timeout(function() {
                                $scope.show_default_nickname_notification = false;
                            }, 20000);
                        }        
                    });                       
                }
            }
        });
        
    
    }
    
    $scope.firebase_references = function() {
        return $scope.compute_firebase_references({user_uid: $scope.login_obj.user.uid, 
                                                   conf_key: $scope.conf_key,
                                                   server_name: $scope.server_name});
    }
   
    $scope.compute_firebase_references = function(inputs) {
        // inputs is {user_uid: "<>", conf_key: "<>"}
        
        var connection_state = $scope.firebase_base + "/.info/connected";
        var firebase_user = $scope.firebase_base + "users/" + inputs.user_uid;
        var conference = $scope.firebase_base + "conferences/" + inputs.conf_key;
        var conference_images = conference + "/images";
        var conference_comments = conference + "/comments";
        var requests = conference + "/requests";
        var conference_users = conference + "/users";
        var conference_user = conference + "/users/" + inputs.user_uid;
        var connected = conference_user + "/connected";
        
        return {
            firebase_user: firebase_user,
            conference_user: conference_user,
            conference_users: conference_users,
            conference: conference,
            conference_images: conference_images,
            conference_comments: conference_comments,
            requests: requests,
            connected: connected,
            connection_state: connection_state,
        };
    }
   
    $scope.initialize_user_bindings = function(user) {
        var references = $scope.firebase_references();
   
        $scope.global_user_object = $firebase(new Firebase(references.firebase_user));
        $scope.conference_user_object = $firebase(new Firebase(references.conference_user));
    }
   
    $scope.initialize_bindings = function() {
        var references = $scope.firebase_references();

        $scope.conference = $firebase(new Firebase(references.conference));
        $scope.images = $firebase(new Firebase(references.conference_images));
        $scope.comments = $firebase(new Firebase(references.conference_comments));
       
        $scope.requests_ref = new Firebase(references.requests);
        $scope.requests_ref.on('child_added', $scope.request_added);
        
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
                    $scope.conference_user_object.$update({page_visible: true});
                    $scope.$apply();
                },
                'hide.visibility': function() {
                    $log.info("page not visible");
                    $scope.conference_user_object.$update({page_visible: false});
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
    
        $scope.conference_user_object.$update({connected: true,
                                               page_visible: true,
                                               time_connected:Firebase.ServerValue.TIMESTAMP});
    }
    
    $scope.mark_user_disconnected = function() {
        $scope.conference_user_object.$update({connected: false});
    }
   
    $rootScope.$on("$firebaseSimpleLogin:login", function(e, user) {
        $log.info("User " + user.id + " logged in");
        $scope.self_uid = user.uid;
        
        $scope.initialize_user_bindings(user);
        
        $log.info("bound user bindings");
        $scope.watch_connection_state();
        $scope.watch_page_visibility();

        if($scope.perform_setup_on_login) {
            $log.info("perform_setup_on_login");
            $scope.global_user_object.$update({nickname: $scope.new_nickname});
            $scope.conference_user_object.$update({nickname: $scope.new_nickname});
        } else {
            // see what the user has in his global object, and copy from there
            $scope.global_user_object.$on('loaded', function(){
                $scope.conference_user_object.$update({nickname: $scope.global_user_object.nickname})                
            });
        }
        
        $scope.initialize_bindings();     
        $scope.setup_logout_handler();


    });
    
    $scope.setup_logout_handler = function() {
        $rootScope.$on("$firebaseSimpleLogin:logout", function() {
            $log.info("logout");
            $scope.mark_user_disconnected();
            $scope.logged_in_and_ready = false;
            $scope.status_string = "logged out";
        });
    }
    
   
    $scope.open_nick_change_modal = function() {
        $scope.show_default_nickname_notification = false;
        $scope.modalInstance = $modal.open({templateUrl: "nick_change_modal.html",
                                            controller: PhotozzapNickChangeModalCtrl,
                                            scope: $scope
                                            });
    };    
    
    $scope.nickname_change = function(nickname) {
        $scope.global_user_object.$update({nickname: nickname});
        $scope.conference_user_object.$update({nickname: nickname});
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
   
    $scope.close_conference = function() {
        $log.info("setting status to close_requested");
        $scope.conference.$update({status: "close_requested"});
    }
    
    $scope.$on('upload_image_data', function(event, data){ 
        $log.info("upload_image_data, cloudinary id: " + data.id);
        $scope.images.$add({id: data.id,
                            time_added: Firebase.ServerValue.TIMESTAMP});
    });
    
    
    
    
    // watch window size    
    $scope.retrieve_window_dimensions = function() {
        $scope.window_width = $(window).width();
        $scope.window_height = $(window).height();
        $scope.$apply();    
    }
    
    angular.element($window).bind('resize', function () {
        $scope.retrieve_window_dimensions();
    });
    
    // watch height of photo-thumbnails element, we may need to adjust our image height
    // to allow this element to be displayed
    var photo_thumbnails_element = $("#photo-thumbnails");
    $scope.photo_thumbnails_height = 0;
    
    // whether to display controls at the expense of full screen height or not
    $scope.display_controls = true;
    
    $scope.$watch
    (
        function () {
            return photo_thumbnails_element.height();
        },
        function (newValue, oldValue) {
            if (newValue != oldValue) {
                $log.info("photo-thumbnails height: ", newValue);
                $scope.photo_thumbnails_height = newValue;
            }
        }
    );       
    
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
    

    // watch variables which may cause us to resize window
    $scope.$watchCollection('[window_width, window_height, photo_thumbnails_height, display_controls]', 
                            function(newValues, oldValues) {
        $scope.resize_handler();
    });    
    
    $scope.resize_handler = function() {
        var new_width = $scope.window_width;
        var new_height = $scope.window_height;
        
        $log.info("resize_handler: new dimensions: ", new_width, "x", new_height,
                  " current dimensions: ", $scope.window_dimensions.width, "x", $scope.window_dimensions.height );
        
        var pixelRatio = 1;
        if( window.devicePixelRatio != undefined ) {
            pixelRatio = window.devicePixelRatio;
        }
        
        $scope.full_params.width = $scope.round_dimension(new_width * pixelRatio);
        $scope.full_params.height = $scope.round_dimension(new_height * pixelRatio);
        
        if (new_width == $scope.window_dimensions.width && 
            Math.abs(new_height - $scope.window_dimensions.height) < 60) {
            // don't do anything, window resize is due to user scrolling down
        } else {
            if( $scope.display_controls && new_height > 0 ) {
                new_height = new_height - $scope.photo_thumbnails_height;
            }
        
            $scope.window_dimensions.width = new_width;
            $scope.window_dimensions.height = new_height;
            $log.info("resize_handler: set dimensions to ", $scope.window_dimensions.width, "x", $scope.window_dimensions.height);
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
    
    $scope.request_added = function(snapshot) {
        var request_data = snapshot.val();
        $log.info("request_added: ", request_data);
        var currentTimestamp = new Date().getTime();
        if (request_data.timestamp + 120000 < currentTimestamp) {
            // request too old
            return;
        }
        
        if ($scope.login_obj.user.uid == request_data.user_id) {
            // ignore self requests
            return;
        }
        
        if (request_data.type == "look_here") {
            // switch to that image
            $log.info("look_here request");
            $scope.show_image(request_data.image_id);
        } else if (request_data.type == "follow_me") {
            $log.info("follow_me request");
            var user_id = request_data.user_id;
            var watch_path = "conference.users['" + user_id + "'].viewing_image_id";
            $log.info("watch_path: ", watch_path, " ", $scope.$eval(watch_path));
            
            if ($scope.watch_followed_user_handle != undefined) {
                // stop watching previous expression
                $scope.watch_followed_user_handle();
                $scope.watch_followed_user_handle = undefined;
                $scope.followed_user_image_id = undefined;
            }
            
            $scope.watch_followed_user_handle = $scope.$watch(watch_path, function(newValue, oldValue) {
                $log.info("followed user viewing_image_id changed: ", newValue, " oldValue: ", oldValue);
                $scope.show_image_following(newValue);
                $scope.followed_user_image_id = newValue;
            });
        }
    }
    
    $scope.rebuild_notifications = function() {
        if ($scope.conference == undefined) {
            // cannot do anything yet
            return;
        }    
        var sorted_notifications_array = $filter('orderObjectByAndInsertId')($scope.conference.notifications, 'timestamp');
        $scope.sorted_notifications = $filter('filter')(sorted_notifications_array, function(elt) {
            var currentTimestamp = new Date().getTime();
            if (elt.user_key != $scope.self_uid &&  // don't display notifications for current user
                elt.timestamp + 120000 > currentTimestamp) // don't display notifications older than 10s (in case they didn't get cleared)
            { 
                return true; 
            } else {
                $log.info("notification too old, elt.timestamp: " + elt.timestamp + " currentTimestamp: " + currentTimestamp);
                return false;
            }
        });
        if ($scope.show_default_nickname_notification) {
            if ($scope.sorted_notifications == undefined) {
                $scope.sorted_notifications = [];
            }
            $scope.sorted_notifications.push({ id:   "default_nickname_notification",
                                               type: "default_nickname"});
        }
    }
    
    $scope.$watch("show_default_nickname_notification", function(newValue, oldValue) {
        $scope.rebuild_notifications();
    });
    
    $scope.$watch("conference.notifications", function(newValue, oldValue) {
        $scope.rebuild_notifications();
    }, true);
    
    $scope.start_watch_photo_index = function() {
        $scope.$watch("global_data.photo_index", function(newValue, oldValue) {
            $log.info("global_data.photo_index changed: " + newValue);
            // do we need to load a new photo ?
            $scope.check_and_load_new_url(newValue);
            
            // update user object on firebase
            $scope.conference_user_object.$update({viewing_image_id: $scope.sorted_images[newValue].id});
            
            if ($scope.watch_followed_user_handle != undefined  &&
                $scope.followed_user_image_id != $scope.conference_user_object.viewing_image_id) {
                // stop following user, as we've switched to another image
                $log.info("stop following user");
                $scope.watch_followed_user_handle();
                $scope.watch_followed_user_handle = undefined;
                $scope.followed_user_image_id = undefined;
            }
            
            if (! $scope.conference_user_object.page_visible ) {
                // in some cases the browser doesn't properly reset page visibility to true
                $scope.conference_user_object.$update({page_visible: true});
            }
            
        });
    }
 
    $scope.show_image_following = function(image_id) {
        var photo_index = $scope.global_data.photo_state_by_id[image_id].photo_index;
        $scope.global_data.photo_index = photo_index;
        $("html, body").animate({ scrollTop: 0 }, 400);
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
    
    $scope.cloudinary_thumbnail_short_url = function(image_id) {
        if (image_id == undefined) {
            return "holder.js/100x100/text:na";
        }
        return $.cloudinary.url(image_id + ".jpg", {crop: 'fill', 
                                                         width: DEFAULT_THUMBNAIL_DIMENSION, 
                                                         height: DEFAULT_THUMBNAIL_SHORT_DIMENSION,
                                                         quality: DEFAULT_COMPRESSION,
                                                         sharpen: 400});
    };        
    
}
