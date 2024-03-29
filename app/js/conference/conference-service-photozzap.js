/* global conferenceModule */
/* global firebase */


conferenceModule.factory('photozzapService', ["$rootScope", "$log", "$firebaseAuth", "$firebaseObject", "$firebaseArray", "$q", "$timeout", "photozzapConfig", 
function ($rootScope, $log, $firebaseAuth, $firebaseObject, $firebaseArray, $q, $timeout, photozzapConfig) {
    var service = {
    
    };
    
    $log.info("photozzapService initialize, photozzapConfig:", photozzapConfig);
    
    firebase.initializeApp(photozzapConfig.firebaseConfig);
    
    service.rootRef = firebase.database().ref().child(photozzapConfig.firstNode);
    service.connectionDetectionRef = firebase.database().ref().child(".info/connected");

    // this promise will be resolved after basic authentication and global user node setup is done
    var authentication_init_defer = $q.defer();
    
    // this promise will be resolved after a conference is initialized
    var conference_init_defer = $q.defer();
    
    
    var authenticate = function(){
        $log.info("photozzapService.authenticate");
    
        var defer = $q.defer();
    
        var auth = $firebaseAuth();
        
        //var authData = auth.$getAuth();
        

        auth.$onAuthStateChanged(function(authData) {
            $log.info("authData: ", authData);            
            
            
            if(authData) {
                $log.info("photozzapService: already authenticated");
                service.authData = authData;
                defer.resolve(authData);
            } else {
            
                auth.$signInAnonymously().then(function(authData) {
                    service.authData = authData;
                    $log.info("anonymous authentication successful");
                    defer.resolve(authData);
                }).catch(function(error) {
                    $log.error("anonymous authentication unsucessful", error);
                    defer.reject("authentication error" + error);
                });
                
            };            
            
        });
        
        

        
        return defer.promise;
    };

    var createGlobalUserNode = function(authData){
        var defer = $q.defer();
    
        service.global_user_node = $firebaseObject(service.rootRef.
                                                       child('users').
                                                       child(authData.uid));
                                                       
        service.global_user_node.$loaded().then(function(){
            service.global_user_node.time_connected = firebase.database.ServerValue.TIMESTAMP;
            service.global_user_node.$save().then(function(){
                defer.resolve();
            });            
        });

  
        return defer.promise;
    };
    
    
    var getConferenceRef = function(conference_key) {
        return service.rootRef.child('conferences').child(conference_key);
    };
    
    var createConferenceNode = function(conference_key) {
        var defer = $q.defer();
        
        service.conference_node = $firebaseObject(getConferenceRef(conference_key));
        service.conference_node.$loaded().then(function(data){
            $log.info("createConferenceNode data", data);
            if(data.name == undefined) {
                $log.error("no name for conference");
                defer.reject("conference " + conference_key + " doesn't exist")
            }
            defer.resolve();
        });
        
        return defer.promise;
    };
    
    var createConferenceUserNode = function(authData, conference_key){
        var defer = $q.defer();
    
        // get user unique key
        $log.info("user uid: ", authData.uid);
        
        service.conference_user_node = $firebaseObject(getConferenceRef(conference_key).
                                                           child('users').
                                                           child(authData.uid));
        
        var connectedRef = getConferenceRef(conference_key).child('users').child(authData.uid).child('connected');

        service.conference_user_node.$loaded().then(function(){
            service.conference_user_node.time_connected = firebase.database.ServerValue.TIMESTAMP;
            if(! service.conference_user_node.nickname) {
                // no nickname defined
                // do we have one in the global user node ?
                var global_nickname = service.global_user_node.nickname;
                if( global_nickname ) {
                    $log.info("copying nickname from global user node: ", global_nickname);
                    service.conference_user_node.nickname = global_nickname;
                } else {
                    // emit broadcast to request nickname change
                    var nickname = "Guest" + randomNumString(5);
                    service.conference_user_node.nickname = nickname;
                }
            }
            // the user is not viewing any image at startup
            service.conference_user_node.currently_viewing = null;
            service.conference_user_node.connected = true;
            service.conference_user_node.page_visible = true;
            service.conference_user_node.$save().then(function(){
                // add on-disconnect call
                connectedRef.onDisconnect().set(false);
                defer.resolve();
            });
            
            service.connectionDetectionRef.on('value', function(snapshot)
            {
               if (snapshot.val() === true ) {
                   service.conference_user_node.connected = true;
                   service.conference_user_node.$save();
               }
            });
        });
        
        return defer.promise;
    };
    
    var createConferenceImagesArray = function(conference_key) {
        var defer = $q.defer();
        
        service.conference_images_array = $firebaseArray(getConferenceRef(conference_key).
                                                         child('images'));
        service.conference_images_array_upload_only = $firebaseArray(getConferenceRef(conference_key).
                                                         child('images'));        
        
        
        service.conference_images_array.$loaded().then(function(){
            watchImagesArray();
            defer.resolve();
        });
        
        return defer.promise;
    };

    var createConferenceUsersArray = function(conference_key) {
        var defer = $q.defer();
        
        service.conference_users_array = $firebaseArray(getConferenceRef(conference_key).
                                                        child('users'));
        
        service.conference_users_array.$loaded().then(function(){
            $log.info("users loaded");
            defer.resolve();
        });
        
        return defer.promise;        
    };
    
    var watchImagesArray = function() {
        // get notified on changes
        service.conference_images_array.$watch(function(event_data){
            if(event_data.event == "child_added") {
                var imageIndex = service.conference_images_array.$indexFor(event_data.key);
                var imageData = service.conference_images_array.$getRecord(event_data.key);
                $rootScope.$emit("image_added", {imageData: imageData, imageIndex: imageIndex});
            }
        });    
    };
    
    var watchRequestsArray = function(conference_key) {
        // get a ref to the requests array
        service.requests_array = $firebaseArray(getConferenceRef(conference_key).
                                                                 child('requests'));
                                                                 
        service.requests_array.$watch(function(event_data){
            if(event_data.event == "child_added") {
                var key = event_data.key;
                var request_data = service.requests_array.$getRecord(key);
                if(request_data.type == "follow_me" ) {
                    if(request_data.user_id != service.getUid()) { // don't follow self requests
                        // broadcast 
                        $log.info("received follow_me request");
                        $rootScope.$emit("follow_user", {user_id: request_data.user_id});
                    }
                }
            }
        });
        
    };
    
    // **** service public API ****
    
    service.getUid = function() {
        return service.authData.uid;
    };
    
    service.getInitializedPromise = function() {
        return authentication_init_defer.promise;
    };
    
    service.getConferenceInitializedPromise = function() {
        return conference_init_defer.promise;
    };
    
    service.getConferenceKey = function() {
        return service.conference_key;
    };
    
    service.changeNickname = function(newNickname) {
        service.conference_user_node.nickname = newNickname;
        service.conference_user_node.$save();
        service.global_user_node.nickname = newNickname;
        service.global_user_node.$save();        
    };
    
    // only call when initialized
    
    service.getConferenceNode = function(){
        return service.conference_node;
    };
    
    service.getImagesArray = function() {
        return service.conference_images_array;
    };
    
    service.getUsersArray = function() {
        return service.conference_users_array;
    };
    
    service.getGlobalUserNode = function() {
        return service.global_user_node;
    };
    
    // indicate which image the user is currently viewing
    service.currentlyViewing = function(image_id) {
        service.conference_user_node.currently_viewing = image_id;
        service.conference_user_node.$save();
    };
    
    // visibility related functions
    service.markPageVisible = function() {
        service.conference_user_node.connected = true;
        service.conference_user_node.page_visible = true;
        service.conference_user_node.$save();
    };
    
    service.markPageNotVisible = function() {
        service.conference_user_node.page_visible = false;
        service.conference_user_node.$save();    
    };
    
    // follow related functions
    service.requestFollowMe = function() {
        // unfollow, if we were following someone else
        service.unfollow();
        
        service.requests_array.$add({user_id: service.getUid(),
                                     timestamp: firebase.database.ServerValue.TIMESTAMP,
                                     type: "follow_me"}).
        then(function(ref) {
            $timeout(function() {
                $log.info("Removing request: ");
                // service.requests_array.$remove(ref);
                ref.remove();
            }, 5000);
        });
    };
    
    service.startFollowing = function(userId) {
        // unfollow first
        service.unfollow();
        
        // get a reference to this user id's currently_viewing key
        var userCurrentlyViewingRef = service.conference_users_array.$ref().child(userId).child('currently_viewing');
        var userCurrentlyViewingObj = $firebaseObject(userCurrentlyViewingRef);
        service.followUserWatch = userCurrentlyViewingObj.$watch(function(){
            var imageId = userCurrentlyViewingObj.$value;
            if(imageId != undefined) {
                $log.info("followed user on image id: ", imageId);
                $rootScope.$emit("followed_user_viewing", {image_id: imageId});
            } else {
                $log.info("followed user closed photoswipe");
                $rootScope.$emit("followed_user_closed");
            }
        });        
    };
    
    service.unfollow =  function() {
        if(service.followUserWatch != undefined) {
            service.followUserWatch();
            service.followUserWatch = undefined;
        }
    };
    
    service.addImage = function(imageData) {
        var image = {id: imageData.id,
                     width: imageData.width,
                     height: imageData.height,
                     time_added: firebase.database.ServerValue.TIMESTAMP,
                     user_id: service.authData.uid};
        $log.info("adding image ", image);
        service.conference_images_array_upload_only.$add(image);
    };
    
    service.create_conference = function(conferenceName) {
        var defer = $q.defer();
    
    
        $log.info("photozzapService.create_conference, name: ", conferenceName);
        var prefix = randomString(6);
        var conferenceNameEncoded = conferenceName.replace(/[^a-zA-Z0-9]/g, "-");
        var tentativeConfKey = prefix + "-" + conferenceNameEncoded;        
        
        var tentativeConferenceRef = service.rootRef.
                                         child('conferences').
                                         child(tentativeConfKey)

        tentativeConferenceRef.once('value', function(snapshot){
            if(snapshot.val() === null) {
                $log.info("conference ", tentativeConfKey, " does not exist, creating");
                
                var conferenceObject = $firebaseObject(tentativeConferenceRef);
                conferenceObject.name = conferenceName;
                conferenceObject.owner_uid = service.authData.uid;
                conferenceObject.status = "open";
                conferenceObject.create_time = new Date().getTime();
                conferenceObject.close_after_time = new Date().getTime() + 7 * 24 * 60 * 60 * 1000; // shutdown after 7 days
                
                conferenceObject.$save().then(function(ref) {
                    defer.resolve(tentativeConfKey);
                });;
                
            } else {
                $log.info("conference ", tentativeConfKey, " exists, trying again");
                return service.create_conference(conferenceName);
            };
        });

        return defer.promise;
    };
    
    
    service.request_zip_url = function()
    {
        var defer = $q.defer();
        
        var zip_url_ref = service.conference_node.$ref().child('download_zip_url');
        var request_zip_url = service.conference_node.$ref().child('request_zip_url');
        zip_url_ref.on('value', function(snapshot){
           var download_zip_url = snapshot.val();
           
           if (download_zip_url != null)
           {
           
                $log.info('saw download_zip_url', download_zip_url);
               
               setTimeout( function(){
                   $log.info("cleaning up zip urls");
                   // now remove the value
                   zip_url_ref.set(null);
               }, 1000);
               
               defer.resolve(download_zip_url);
               
               zip_url_ref.off('value');
               
           }
           

        });
        
        // request download link
        service.conference_node.request_zip_url = firebase.database.ServerValue.TIMESTAMP;
        service.conference_node.$save();
        
        return defer.promise;
        
    }
    
    service.initialize = function(conference_key) {
    
        if( service.initializeInProgress ) {
            $log.info("photozzapService, initialization in progress, skipping");
            
        };
        service.initializeInProgress = true;
    
        $log.info("photozzapService.initialize");
        var authenticate_promise = authenticate();
                
        authenticate_promise.then(function(authData) {
            service.authData = authData;
            
            createGlobalUserNode(authData).then(function(){
                authentication_init_defer.resolve();
            });
            
        });
        
    };
    
    service.initializeConference = function(conference_key) {
        service.initialize();
        service.getInitializedPromise().then(function(){
            $log.info("photozzapService.initializeConference conference key: ", conference_key);
            service.conference_key = conference_key;
        
            createConferenceNode(conference_key).then(function(){
                createConferenceUserNode(service.authData, conference_key).then(function(){
                    createConferenceImagesArray(conference_key).then(function(){
                        createConferenceUsersArray(conference_key).then(function(){
                            watchRequestsArray(conference_key);
                            conference_init_defer.resolve();                        
                        });
                    });
                });
            }, function(msg) {
                $log.error("could not initialize conference: ", msg);
                conference_init_defer.reject(msg);
            });
        });
   };
   
    return service;
}]);