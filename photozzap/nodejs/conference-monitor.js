var firebase = require('firebase');
var cloudinary = require('cloudinary');
var push = require( 'pushover-notifications' );
//var config = require('./' + process.argv[2]);

var env = process.env.PHOTOZZAP_ENV;
if(!env) {
    throw "PHOTOZZAP_ENV not set [PHOTOZZAP_ENV=dev]";
}

var fb_root = "photozzap2-"+env+".firebaseio.com";

firebase.initializeApp({
  databaseURL: "https://" + fb_root,
  serviceAccount: "photozzap2-"+ env + ".json"
});

var rootRef = firebase.database().ref();

var Globals = {
    conferences: {},
}

cloudinary.config({ 
  cloud_name: 'photozzap', 
  api_key: '751779366151643', 
  api_secret: 'OxGxJe0f-jGo1BAsmmlDdRPb7NM'
});

var conferencesRef = rootRef.child("/photozzap/conferences");
var usersRef = rootRef.child("/photozzap/users");

var cleanupConferencesRef = rootRef.child("/photozzap/conferences");
var cleanupUsersRef = rootRef.child("/photozzap/users");

function ConferenceObject(key, ref, close_after_time, env) {
    this.key = key;
    this.env = env;
    
    this.notify_pushover = false;
    
    this.imagesRef = ref.child('images');
    this.requestsRef = ref.child('request');
    this.statusRef = ref.child('status');
    this.zipUrlRef = ref.child('download_zip_url');
    this.requestZipUrlRef = ref.child('request_zip_url');
    this.notifyPushoverRef = ref.child('notify_pushover');
    
    this.image_ids = [];
    

    this.log_event = function(message) {
        console.log((new Date()).toUTCString(), ": [", this.key ,"] ", message);
    };
    

    this.imageChildAdded = function(snapshot, prevChildKey) {
        this.log_event("image added");
        
        var image_data = snapshot.val();
        var image_id = image_data.id;
        this.image_ids.push(image_id);

    };   


    this.requestZipUrl = function(snapshot)
    {
        this.log_event("requestZipUrl");
        var zip_url = cloudinary.utils.download_zip_url({public_ids: this.image_ids, resource_type: 'image'});
        this.zipUrlRef.set(zip_url);            
        
    }

    this.requestChildAdded = function(snapshot) {
        var request_data = snapshot.val();
        var user_key = request_data.user_id;
        
        if (request_data.type == "download_all") {
            // create download link for all photos
            this.log_user_event(user_key, "creating download zip");
            // generate zip url

            
        }
        
        
    }
    

   this.statusChanged = function(snapshot) {
      if(snapshot.val() === null) {
        return;
      } else {
        var status = snapshot.val();
        this.log_event("status for " + this.key + ": " + status);
        if (status == "close_requested") {
            this.closeConference();
        }
      }
    }

    this.closeConference = function() {
        this.log_event("closing");
    
        // close conference
        var self = this;
        cloudinary.api.delete_resources_by_tag(this.key, function(result){
            self.log_event("cloudinary delete result: " + result);
        });
        // remove callbacks
        this.removeCallbacks();
        // remove users, images, comments, requests, notifications
        this.imagesRef.remove();
        this.requestsRef.remove();
        
        // finally, mark conference closed
        this.statusRef.set("closed");
        
        // delete conference entry
        deleteConferenceEntry(this.key);
        
    }
    
    this.addCallbacks = function() {
        this.log_event("adding callbacks");    
        this.imagesRef.on('child_added', this.imageChildAdded, function(){}, this);
        this.requestsRef.on('child_added', this.requestChildAdded, function(){}, this);
        this.statusRef.on('value', this.statusChanged, function(){}, this);
        this.requestZipUrlRef.on('value', this.requestZipUrl, function(){}, this);
    }
    
    this.removeCallbacks = function() {
        this.log_event("removing callbacks");
        this.imagesRef.off('child_added');
        this.requestsRef.off('child_added');
        this.statusRef.off('value');
        this.requestZipUrl.off('value');
        this.notifyPushoverRef.off('value');
        clearTimeout(this.closeTimeout);
    }        

    this.addCallbacks();    
    var self = this;
    
    // call shutdown method
    var closeDelay = close_after_time - new Date().getTime();
    this.log_event("Will close after " + closeDelay + " milliseconds");
    this.closeTimeout = setTimeout(function() {
        self.closeConference();
    }, closeDelay);
    
    
}

function deleteConferenceEntry(key) {
    console.log((new Date()).toUTCString(), "deleteConferenceEntry: " + key);
    delete Globals.conferences[key];
}


var cleanupTimeout = setInterval(function() {
    
    var current_time = new Date().getTime();
    var delete_after_delay = 30 * 24 * 60 * 60 * 1000;
    
    cleanupConferencesRef.off();
    cleanupUsersRef.off();
    
    // open all of the conferences children
    cleanupConferencesRef.on('child_added', function(snapshot){
        var conference_data = snapshot.val();
        var conference_key = snapshot.key;
        if(conference_data.status == "closed") {
            // look at how long it's been closed
            if (conference_data.close_after_time + delete_after_delay < current_time) {
                console.log(new Date().toUTCString(), "deleting conference", conference_key);
                var deleteRef = cleanupConferencesRef.child(conference_key);
                deleteRef.remove();
            }
        }
    });
    
    // open all of the users children
    cleanupUsersRef.on('child_added', function(snapshot){
        var user_data = snapshot.val();
        var user_key = snapshot.key;
        // look at how long it's been since the user logged in
        if (user_data.time_connected + delete_after_delay < current_time) {
            console.log(new Date().toUTCString(), "deleting user", user_key);
            var deleteRef = cleanupUsersRef.child(user_key);
            deleteRef.remove();
        }
    });
        
    
}, 600000)

conferencesRef.on('child_added', function(snapshot){
    var ref = snapshot.ref;
    var key = snapshot.key;
    var conference_data = snapshot.val();
    
    if (conference_data.status != "closed") {
        console.log("monitoring conference ", key, " ", conference_data.name);
        Globals.conferences[key] = new ConferenceObject(key, 
                                                        ref,
                                                        conference_data.close_after_time,
                                                        env);
    }
    
});
