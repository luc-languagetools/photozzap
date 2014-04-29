var Firebase = require('firebase');
var cloudinary = require('cloudinary');
var push = require( 'pushover-notifications' );
var config = require('./' + process.argv[2]);

var p = new push( {
    user: config.pushoverUser,
    token: config.pushoverToken,
});

var Globals = {
    conferences: {},
}

cloudinary.config({ 
  cloud_name: config.cloudinaryName, 
  api_key: config.cloudinaryApiKey, 
  api_secret: config.cloudinaryApiSecret
});

var conferencesPath = config.firebaseRoot + "/conferences";
var conferencesRef = new Firebase(conferencesPath);
conferencesRef.auth(config.firebaseSecret);


function ConferenceObject(key, path, name, url) {
    console.log("ConferenceObject path: ", path);
    this.key = key;
    this.path = path;
    this.conference_name = name;
    this.conference_url = url;
    
    this.user_cache = {};
    
    var imagesPath = path + "/images";
    this.imagesRef = new Firebase(imagesPath);
    
    var usersPath = path + "/users";
    this.usersRef = new Firebase(usersPath);
    
    var commentsPath = path + "/comments";
    this.commentsRef = new Firebase(commentsPath);
    
    var notificationsPath = path + "/notifications";
    this.notificationsRef = new Firebase(notificationsPath);
    
    var requestsPath = path + "/requests";
    this.requestsRef = new Firebase(requestsPath);
    
    var cloudinarySignaturePath = path + "/cloudinary_signature";
    this.cloudinarySignatureRef = new Firebase(cloudinarySignaturePath);

    var statusPath = path + "/status";
    this.statusRef = new Firebase(statusPath);
    
    this.log_event = function(message) {
        console.log((new Date()).toUTCString(), ": [", this.key ,"] ", message);
    };
    
    this.user_nickname = function(user_key) {
        if (this.user_cache[user_key] != undefined)
            return this.user_cache[user_key].nickname;
        return undefined;
    };
    
    this.log_user_event = function(user_key, message) {
        this.log_event(user_key + ": " + message);
    };
    
    this.imageChildAdded = function(snapshot) {
        console.log("conference ", this.key, ": image added");
    };   

    this.addNotification = function(user_key, data) {
        var userNickname = this.user_nickname(user_key);
        if (userNickname == undefined) // default nickname if not available
            userNickname = "guest";
        var newNotificationRef = this.notificationsRef.push();
        data.user_key = user_key;
        data.timestamp = new Date().getTime();            
        data.nickname = userNickname;
        newNotificationRef.set(data);
        var self = this;
        setTimeout(function() {
            self.removeNotification(newNotificationRef);
        }, 5000);
        
        // send pushover notification
        var sendPushoverNotification = false;
        var notification_message = undefined;
        var notification_title = undefined;
        if (data.type == "connected") {
            sendPushoverNotification = true;
            notification_message = userNickname + " connected to conference " + this.conference_name;
            notification_title = this.conference_name + ": user connected";
        } else if (data.type == "comment") {
            sendPushoverNotification = true;
            notification_message = userNickname + " commented on " + this.conference_name + ": " +
            data.text;
            notification_title = this.conference_name + ": new comment";        
        }
        if (sendPushoverNotification) {
            var msg = {
                message: notification_message,
                title: notification_title,
                url: this.conference_url,
                url_title: "view " + this.conference_name,
            };
            p.send( msg, function( err, result ) {
                if ( err ) {
                    console.log("error pushing notification ", err);
                }
                console.log("pushing notification ", result);
            });                    
        }
        
    };
    
    this.removeNotification = function(notificationRef) {
        this.log_event("removing notification " + notificationRef.name());
        notificationRef.remove();
    }
    
    this.commentChildAdded = function(snapshot) {
        var comment_data = snapshot.val();
        var user_key = comment_data.user_id;
        var current_timestamp =  new Date().getTime();
        if (current_timestamp - comment_data.time_added < 120000) {
            // comment less than 60 seconds old
            this.addNotification(user_key, {type: "comment",
                                            image_id: comment_data.image_id, 
                                            text: comment_data.text});
        }
    }
    
    this.userChildChanged = function(snapshot) {
        var key = snapshot.name();
        var user_data = snapshot.val();
        if (this.user_cache[key] == undefined) {
            // new entry
            if( user_data.connected ) {
                this.log_user_event(key, "connected");
                this.addNotification(key, {type: "connected"});            
            }
        } else {
            // look at what changed
            
            // did the user connect ?
            if (this.user_cache[key].connected == false &&
                user_data.connected == true) 
            {
                this.log_user_event(key, "connected");
                this.addNotification(key, {type: "connected"});
            } else if (this.user_cache[key].connected == true &&
                       user_data.connected == false) 
            {
                this.log_user_event(key, "disconnected");
                this.addNotification(key, {type: "disconnected"});
            }
            
            // is user away ?
            if (this.user_cache[key].page_visible == false &&
                user_data.page_visible == true) {
                this.log_user_event(key, "is back");
                this.addNotification(key, {type: "back"});
            } else if (this.user_cache[key].page_visible == true &&
                user_data.page_visible == false) {
                this.log_user_event(key, "is away");
                this.addNotification(key, {type: "away"});
            }
            
            // user watching different picture ?
            if (user_data.viewing_image_id != undefined &&
                this.user_cache[key].viewing_image_id != user_data.viewing_image_id) {
                this.log_user_event(key, "viewing image " + user_data.viewing_image_id);
                this.addNotification(key, {type: "viewing", image_id: user_data.viewing_image_id});
            }
        }
        
        this.user_cache[key] = user_data;
    };

    this.requestChildAdded = function(snapshot) {
        var request_data = snapshot.val();
        var user_key = request_data.user_id;
        
        if (request_data.type == "look_here") {
            this.addNotification(user_key, {type: "look_here", image_id: request_data.image_id});
        } else if (request_data.type == "follow_me") {
            this.addNotification(user_key, {type: "follow_me"});
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
        // close conference
        var self = this;
        cloudinary.api.delete_resources_by_tag(this.key, function(result){
            self.log_event("cloudinary delete result: " + result);
        });
        // remove callbacks
        this.removeCallbacks();
        // remove users, images, comments, requests, notifications
        this.imagesRef.remove();
        this.usersRef.remove();
        this.commentsRef.remove();
        this.requestsRef.remove();
        this.cloudinarySignatureRef.remove();
        
        // finally, mark conference closed
        this.statusRef.set("closed");
        
    }

    // set regular interval to write cloudinary signature
    this.writeCloudinarySignature = function(self) {
        self.log_event("writing cloudinary signature for " + this.key);
        var params = {timestamp: new Date().getTime().toString(),
                      tags: self.key};
        var signature = cloudinary.utils.sign_request(params, {});
        self.cloudinarySignatureRef.set(signature);
    }    
    
    this.addCallbacks = function() {
        this.log_event("adding callbacks");    
        this.imagesRef.on('child_added', this.imageChildAdded, function(){}, this);
        this.usersRef.on('child_added', this.userChildChanged, function(){}, this);
        this.usersRef.on('child_changed', this.userChildChanged, function(){}, this);
        this.commentsRef.on('child_added', this.commentChildAdded, function(){}, this);
        this.requestsRef.on('child_added', this.requestChildAdded, function(){}, this);
        this.statusRef.on('value', this.statusChanged, function(){}, this);
    }
    
    this.removeCallbacks = function() {
        this.log_event("removing callbacks");
        this.imagesRef.off('child_added');
        this.usersRef.off('child_added');
        this.usersRef.off('child_changed');
        this.commentsRef.off('child_added');
        this.requestsRef.off('child_added');
        this.statusRef.off('value');
    }        

    this.addCallbacks();    
    var self = this;
    this.writeCloudinarySignature(self);
    setInterval(function() {
        self.writeCloudinarySignature(self);
    }, 1000 * 60 * 15);    
    
}


conferencesRef.on('child_added', function(snapshot){
    var key = snapshot.name();
    var conference_data = snapshot.val();
    
    if (conference_data.servername == config.serverName) {
        console.log("monitoring conference ", key, " ", conference_data.name);
        Globals.conferences[key] = new ConferenceObject(key, 
                                                        conferencesPath + "/" + key,
                                                        conference_data.name,
                                                        conference_data.url);
    }
    
});

var serverPath = config.firebaseRoot + "/servers/" + config.serverName;
var serverRef = new Firebase(serverPath);
