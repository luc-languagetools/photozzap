
conferenceModule.factory('photozzapService', ["$rootScope", "$log", "$firebaseAuth", "$firebaseObject", "$firebaseArray", "$q", "photozzapConfig", 
function ($rootScope, $log, $firebaseAuth, $firebaseObject, $firebaseArray, $q, photozzapConfig) {
    var service = {
    
    };
    
    $log.info("photozzapService initialize, photozzapConfig:", photozzapConfig);
    
    var initialized_defer = $q.defer();
       
    
    var authenticate = function(){
        $log.info("photozzapService.authenticate");
    
        var defer = $q.defer();
    
        var ref = new Firebase(photozzapConfig.firebaseRoot);
        var auth = $firebaseAuth(ref);
        
        var authData = auth.$getAuth();
        
        if(authData) {
            $log.info("photozzapService: already authenticated");
            service.authData = authData;
            defer.resolve(authData);
        } else {
        
            auth.$authAnonymously().then(function(authData) {
                service.authData = authData;
                $log.info("anonymous authentication successful");
                defer.resolve(authData);
            }).catch(function(error) {
                $log.error("anonymous authentication unsucessful");
                defer.reject("authentication error" + error);
            });
            
        };
        
        return defer.promise;
    };

    var createGlobalUserNode = function(authData){
        var defer = $q.defer();
    
        var ref = new Firebase(photozzapConfig.firebaseRoot);
        service.global_user_node = $firebaseObject(ref.child(photozzapConfig.firstNode).
                                                       child('users').
                                                       child(authData.uid));
                                                       
        service.global_user_node.$loaded().then(function(){
            service.global_user_node.time_connected = Firebase.ServerValue.TIMESTAMP;
            service.global_user_node.$save().then(function(){
                defer.resolve();
            });            
        });

  
        return defer.promise;
    };
    
    
    var getConferenceRef = function(conference_key) {
        var ref = new Firebase(photozzapConfig.firebaseRoot);
        return ref.child(photozzapConfig.firstNode).child('conferences').child(conference_key);
    };
    
    var createConferenceUserNode = function(authData, conference_key){
        var defer = $q.defer();
    
        // get user unique key
        $log.info("user uid: ", authData.uid);
        
        service.conference_user_node = $firebaseObject(getConferenceRef(conference_key).
                                                           child('users').
                                                           child(authData.uid));
        
        service.conference_user_node.$loaded().then(function(){
            service.conference_user_node.time_connected = Firebase.ServerValue.TIMESTAMP;
            if(! service.conference_user_node.nickname) {
                // no nickname defined
                // do we have one in the global user node ?
                var global_nickname = service.global_user_node.nickname;
                if( global_nickname ) {
                    $log.info("copying nickname from global user node: ", global_nickname);
                    service.conference_user_node.nickname = global_nickname;
                } else {
                    // emit broadcast to request nickname change
                }
            }
            service.conference_user_node.$save().then(function(){
                defer.resolve();
            });
        });
        
        return defer.promise;
    };
    
    var createConferenceImagesArray = function(conference_key) {
        var defer = $q.defer();
        
        service.conference_images_array = $firebaseArray(getConferenceRef(conference_key).
                                                         child('images'));
        
        service.conference_images_array.$loaded().then(function(){
            $rootScope.$emit("images_loaded", service.conference_images_array);
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
            $rootScope.$emit("users_changed", service.conference_users_array);
            watchUsersArray();
        });
        
        return defer.promise;        
    };
    
    var watchUsersArray = function() {
        service.conference_users_array.$watch(function(event_data){
            $log.info("users array changed");
            $rootScope.$emit("users_changed", service.conference_users_array);
        });
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
    
    // **** service public API ****
    
    service.getInitializedPromise = function() {
        return initialized_defer.promise;
    };
    
    // only call when initialized
    service.getGlobalUserNode = function() {
        return service.global_user_node;
    };
    
    // indicate which image the user is currently viewing
    service.currentlyViewing = function(index) {
        service.conference_user_node.currently_viewing = index;
        service.conference_user_node.$save();
    };
    
    service.addImage = function(imageData) {
        var image = {id: imageData.id,
                     width: imageData.width,
                     height: imageData.height,
                     time_added: Firebase.ServerValue.TIMESTAMP,
                     user_id: service.authData.uid};
        $log.info("adding image ", image);
        service.conference_images_array.$add(image);
    };
    
    service.create_conference = function(conferenceName) {
        var defer = $q.defer();
    
    
        $log.info("photozzapService.create_conference, name: ", conferenceName);
        var prefix = randomString(6);
        var conferenceNameEncoded = conferenceName.replace(/[^a-zA-Z0-9]/g, "-");
        var tentativeConfKey = prefix + "-" + conferenceNameEncoded;        
        
        var ref = new Firebase(photozzapConfig.firebaseRoot);
        var tentativeConferenceRef = ref.child(photozzapConfig.firstNode).
                                         child('conferences').
                                         child(tentativeConfKey)

        tentativeConferenceRef.once('value', function(snapshot){
            if(snapshot.val() === null) {
                $log.info("conference ", tentativeConfKey, " does not exist, creating");
                
                var conferenceObject = $firebaseObject(tentativeConferenceRef);
                conferenceObject.name = conferenceName;
                conferenceObject.url = photozzapConfig.conferenceUrlTemplate.replace("confkey", tentativeConfKey);
                conferenceObject.permanent_url = photozzapConfig.permanentUrlTemplate.replace("confkey", tentativeConfKey);
                conferenceObject.servername = photozzapConfig.serverName;
                conferenceObject.owner_uid = service.authData.uid;
                conferenceObject.status = "open";
                conferenceObject.create_time = new Date().getTime();
                conferenceObject.close_after_time = new Date().getTime() + 7 * 24 * 60 * 60 * 1000; // shutdown after 7 days
                
                conferenceObject.$save().then(function(ref) {
                    defer.resolve(conferenceObject.url);
                });;
                
            } else {
                $log.info("conference ", tentativeConfKey, " exists, trying again");
                return service.create_conference(conferenceName);
            };
        });

        return defer.promise;
    };
    
    
    service.initialize = function(conference_key) {
        var authenticate_promise = authenticate();
        
        authenticate_promise.then(function(authData) {
            service.authData = authData;
            
            createGlobalUserNode(authData).then(function(){
                if(conference_key != null) {
                    $log.info("conference key: ", conference_key);
                
                    createConferenceUserNode(authData, conference_key).then(function(){
                        createConferenceImagesArray(conference_key).then(function(){
                            createConferenceUsersArray(conference_key);
                            initialized_defer.resolve();                        
                        });
                    });
                } else {
                    initialized_defer.resolve();
                };
            });
            
        });
        
    };
   
    return service;
}]);