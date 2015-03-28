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


function ConferenceObject(key, path, name, url, create_time, close_after_time, server_name, env) {
    console.log("ConferenceObject path: ", path);
    this.key = key;
    this.path = path;
    this.conference_name = name;
    this.conference_url = url;
    this.server_name = server_name;
    this.env = env;
    this.ip_map = {};
    
    this.notify_pushover = false;
    
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
    
    var statusPath = path + "/status";
    this.statusRef = new Firebase(statusPath);
    
    var viewsPath = path + "/views";
    this.viewsRef = new Firebase(viewsPath);
    
    var zipUrlPath = path + "/download_zip_url";
    this.zipUrlRef = new Firebase(zipUrlPath);
    
    
    var notifyPushoverPath = path + "/notify_pushover";
    this.notifyPushoverRef = new Firebase(notifyPushoverPath);
    
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
        
        var image_data = snapshot.val();
        var user_key = image_data.user_id;
        var current_timestamp =  new Date().getTime();
        if (current_timestamp - image_data.time_added < 60000) {
            // upload less than 60 seconds old
            this.addNotification(user_key, {type: "upload",
                                            image_id: image_data.id});
        }        
        
        // invalidate download zip url, if any
        this.zipUrlRef.remove();
    };   

    this.addNotification = function(user_key, data) {
        var userNickname = this.user_nickname(user_key);
        if (userNickname == undefined) // default nickname if not available
            userNickname = "guest";
        var newNotificationRef = this.notificationsRef.push();
        data.user_key = user_key;
        data.timestamp = Firebase.ServerValue.TIMESTAMP;            
        data.nickname = userNickname;
        newNotificationRef.set(data);
        var self = this;
        var notification_duration = 5000;
        if (data.type == "upload") {
            notification_duration = 10000;
        }
        setTimeout(function() {
            self.removeNotification(newNotificationRef);
        }, notification_duration);
        
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
        if (sendPushoverNotification && this.notify_pushover) {
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
        if (current_timestamp - comment_data.time_added < 120000 &&
            comment_data.text != undefined) {
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
        
        if (user_data.user_ip != undefined) {
            this.ip_map[user_data.user_ip] = true;
            var num_ips = Object.keys(this.ip_map).length;
            this.viewsRef.set(num_ips);
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
        } else if (request_data.type == "download_all") {
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

   this.notifyPushoverChanged = function(snapshot) {
      if(snapshot.val() === null) {
        return;
      } else {
        this.notify_pushover = snapshot.val();
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
        this.usersRef.remove();
        this.commentsRef.remove();
        this.requestsRef.remove();
        
        // finally, mark conference closed
        this.statusRef.set("closed");
        
        // delete conference entry
        deleteConferenceEntry(this.key);
        
    }
    
    this.addCallbacks = function() {
        this.log_event("adding callbacks");    
        this.imagesRef.on('child_added', this.imageChildAdded, function(){}, this);
        this.usersRef.on('child_added', this.userChildChanged, function(){}, this);
        this.usersRef.on('child_changed', this.userChildChanged, function(){}, this);
        this.commentsRef.on('child_added', this.commentChildAdded, function(){}, this);
        this.requestsRef.on('child_added', this.requestChildAdded, function(){}, this);
        this.statusRef.on('value', this.statusChanged, function(){}, this);
        this.notifyPushoverRef.on('value', this.notifyPushoverChanged, function(){}, this);
    }
    
    this.removeCallbacks = function() {
        this.log_event("removing callbacks");
        this.imagesRef.off('child_added');
        this.usersRef.off('child_added');
        this.usersRef.off('child_changed');
        this.commentsRef.off('child_added');
        this.requestsRef.off('child_added');
        this.statusRef.off('value');
        this.notifyPushoverRef.off('value');
        clearInterval(this.cloudinarySignatureTimer);
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
    var key = snapshot.name();
    var conference_data = snapshot.val();
    
    if (conference_data.servername == config.serverName &&
        conference_data.status != "closed") {
        console.log("monitoring conference ", key, " ", conference_data.name);
        Globals.conferences[key] = new ConferenceObject(key, 
                                                        conferencesPath + "/" + key,
                                                        conference_data.name,
                                                        conference_data.url,
                                                        conference_data.create_time,
                                                        conference_data.close_after_time,
                                                        config.env,
                                                        config.serverName);
    }
    
});

var serverPath = config.firebaseRoot + "/servers/" + config.serverName;
var serverRef = new Firebase(serverPath);
