var firebase = require('firebase');
var cloudinary = require('cloudinary');
var push = require( 'pushover-notifications' );
//var config = require('./' + process.argv[2]);

var env = process.env.ENV;
if(!env) {
    throw "ENV not set [ENV=dev]";
}

var fb_root = process.env.FB_ROOT;
if(!fb_root) {
    throw "FB_ROOT not set [FB_ROOT=photozzap2-dev.firebaseio.com]";
}

firebase.initializeApp({
  databaseURL: "https://" + fb_root,
  serviceAccount: "photozzap2-dev.json"
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


function ConferenceObject(key, ref, close_after_time, env) {
    this.key = key;
    this.env = env;
    
    this.notify_pushover = false;
    
    this.imagesRef = ref.child('images');
    this.requestsRef = ref.child('request');
    this.statusRef = ref.child('status');
    this.zipUrlRef = ref.child('download_zip_url');
    this.notifyPushoverRef = ref.child('notify_pushover');
    
    this.log_event = function(message) {
        console.log((new Date()).toUTCString(), ": [", this.key ,"] ", message);
    };
    

    this.imageChildAdded = function(snapshot) {
        this.log_event("image added");
        
        // invalidate download zip url, if any
        this.zipUrlRef.remove();
    };   


    this.requestChildAdded = function(snapshot) {
        var request_data = snapshot.val();
        var user_key = request_data.user_id;
        
        if (request_data.type == "download_all") {
            // create download link for all photos
            this.log_user_event(user_key, "creating download zip");
            var self = this;
            cloudinary.uploader.multi(this.key, function(result){
                self.log_event("created download link: " + result.url);
                var download_link = result.url;
                self.zipUrlRef.set(download_link)
            }, {format: "zip", tags: this.key + "," + this.env + "," + this.server_name});
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
    }
    
    this.removeCallbacks = function() {
        this.log_event("removing callbacks");
        this.imagesRef.off('child_added');
        this.requestsRef.off('child_added');
        this.statusRef.off('value');
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
    console.log("deleteConferenceEntry: " + key);
    delete Globals.conferences[key];
}

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
