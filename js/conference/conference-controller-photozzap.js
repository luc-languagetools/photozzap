conferenceModule.controller("PhotozzapCtrl", 
["$scope", "$rootScope", "$modal", "$log", "$window", "$filter", "$http", "$q", "$timeout", "$location", "$timeout", "$stateParams", "photozzapService", 
function($scope, $rootScope, $modal, $log, $window, $filter, $http, $q, $timeout, $location, $timeout,  $stateParams, photozzapService) {
   

    $scope.show_default_nickname_notification = false;
    $scope.sorted_notifications = [];

    $scope.sorted_users = [];

    
    $scope.logged_in_and_ready = false;
    $scope.status_string = "loading";
    
    $scope.perform_setup_on_login = false;
    $scope.new_nickname = undefined;
   
    $scope.watching_photo_index = false;
    $scope.load_new_url_promise = undefined;
    $scope.last_load_hires_timestamp = 0;
    
    $scope.watch_followed_user_handle = undefined;
    $scope.followed_user_image_id = undefined;
  
    $scope.show_photo_counter = false;
    $scope.show_photo_timeout = undefined;
  
    $scope.init = function() {
        var conference_key = $stateParams.conferenceKey;
        $log.info("initializing PhotozzapCtrl, conference_key: ", conference_key);
        
        photozzapService.initializeConference(conference_key);
        photozzapService.getConferenceInitializedPromise().then(function(){
            $scope.logged_in_and_ready = true;
            $scope.watch_page_visibility();
        });
    }
    
    // todo: fix
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
   
    // todo: fix
    $scope.watch_page_visibility = function() {
        if ($.support.pageVisibility) {
            $log.info("page visibility API supported");
            
            $(document).on({
                'show.visibility': function() {
                    $log.info("page visible");
                    photozzapService.markPageVisible();
                },
                'hide.visibility': function() {
                    $log.info("page not visible");
                    photozzapService.markPageNotVisible();
                }
            });            
        } else {
            $log.info("page visibility API not supported");
        }
    }
   
    // todo: fix
    $scope.mark_user_connected = function() {
        var references = $scope.firebase_references();
        
        var connected_ref = new Firebase(references.connected);
        connected_ref.onDisconnect().set(false);        
    
        $scope.conference_user_object.$update({connected: true,
                                               page_visible: true,
                                               time_connected:Firebase.ServerValue.TIMESTAMP});
    }
    
    // todo: fix
    $scope.mark_user_disconnected = function() {
        $scope.conference_user_object.$update({connected: false});
    }
   
    // todo: fix
    $rootScope.$on("$firebaseAuth:login", function(e, user) {
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
        
        // get user fingerprint
        var fingerprint = $.fingerprint();
        $scope.conference_user_object.$update({fingerprint: fingerprint});
        // get user ip
        $http({method: 'GET', url: 'http://api.hostip.info/get_json.php'}).
            success(function(data, status, headers, config) {
                $scope.conference_user_object.$update({user_ip: data.ip, ip_info: data});
            });        
        
        $scope.initialize_bindings();     
        $scope.setup_logout_handler();


    });
    
    // todo: fix
    $scope.setup_logout_handler = function() {
        $rootScope.$on("$firebaseAuth:logout", function() {
            $log.info("logout");
            $scope.mark_user_disconnected();
            $scope.logged_in_and_ready = false;
            $scope.status_string = "logged out";
        });
    }
    
    // todo: fix
    $scope.open_nick_change_modal = function() {
        $scope.show_default_nickname_notification = false;
        $scope.modalInstance = $modal.open({templateUrl: "nick_change_modal.html",
                                            controller: "PhotozzapNickChangeModalCtrl",
                                            scope: $scope
                                            });
    };    
    
    // todo: fix
    $scope.nickname_change = function(nickname) {
        $scope.global_user_object.$update({nickname: nickname});
        $scope.conference_user_object.$update({nickname: nickname});
    }
   
    // todo: fix
    $scope.close_conference = function() {
        $log.info("setting status to close_requested");
        $scope.conference.$update({status: "close_requested"});
    }
    
    // todo: fix
    $scope.$watch("conference.users", function(newValue, OldValue) {
        if ($scope.conference == undefined) {
            // cannot do anything yet
            return;
        }

        var sorted_users_array =  $filter('orderObjectByAndInsertId')($scope.conference.users, 'time_added');
        sorted_users_array = $filter('filter')(sorted_users_array, {connected: true});
        $scope.sorted_users = $filter('filter')(sorted_users_array, function(value) { return value.viewing_image_id != undefined; });
        
    }, true);
    
    // todo: fix
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
    
    // todo: fix
    $scope.rebuild_notifications = function() {
        if ($scope.conference == undefined) {
            // cannot do anything yet
            return;
        }    
        var sorted_notifications_array = $filter('orderObjectByAndInsertId')($scope.conference.notifications, 'timestamp');
        $scope.sorted_notifications = $filter('filter')(sorted_notifications_array, function(elt) {
            var currentTimestamp = new Date().getTime();
            if ((elt.user_key != $scope.self_uid || elt.type == "upload") &&  // don't display notifications for current user
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
    
    // todo: fix
    $scope.$watch("show_default_nickname_notification", function(newValue, oldValue) {
        $scope.rebuild_notifications();
    });
    
    // todo: fix
    $scope.$watch("conference.notifications", function(newValue, oldValue) {
        $scope.rebuild_notifications();
    }, true);
    
    // todo: fix
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
            
            $scope.show_photo_counter = true;
            if ($scope.show_photo_timeout != undefined) {
                $timeout.cancel($scope.show_photo_timeout);
            }
            $scope.show_photo_timeout = $timeout(function(){ $scope.show_photo_counter = false; }, 1000);
            
        });
    }
 
    // todo: fix
    $scope.show_image_following = function(image_id) {
        var photo_index = $scope.global_data.photo_state_by_id[image_id].photo_index;
        $scope.global_data.photo_index = photo_index;
        $("html, body").animate({ scrollTop: 0 }, 400);
    }
 
    // todo: fix
    $scope.show_image = function(image_id) {
        var photo_index = $scope.global_data.photo_state_by_id[image_id].photo_index;
        $scope.global_data.photo_index = photo_index;
        $("html, body").animate({ scrollTop: 0 }, 400);
    }
 
    $scope.photo_index_from_id = function(image_id) {
        var photo_index = $scope.global_data.photo_state_by_id[image_id].photo_index;
        return photo_index;
    }
 

    // todo: integrate with photoswipe
    $scope.cloudinary_photo_download_url = function(image_data) {
        return $.cloudinary.url(image_data.id + ".jpg", {flags: 'attachment'});
    };
    
    
    // run init
    $scope.init();
    
}]);
