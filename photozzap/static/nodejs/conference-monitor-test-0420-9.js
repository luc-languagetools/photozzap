var Firebase = require('firebase');
var cloudinary = require('cloudinary');
var config = require('./' + process.argv[2]);

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


function ConferenceObject(key, path) {
    console.log("ConferenceObject path: ", path);
    this.key = key;
    this.path = path;
    
    this.user_cache = {};
    
    var imagesPath = path + "/images";
    var imagesRef = new Firebase(imagesPath);
    
    var usersPath = path + "/users";
    var usersRef = new Firebase(usersPath);
    
    var commentsPath = path + "/comments";
    var commentsRef = new Firebase(commentsPath);
    
    var notificationsPath = path + "/notifications";
    this.notificationsRef = new Firebase(notificationsPath);

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
        if (userNickname == undefined) // if we don't have a nickname, don't send notification
            return;
        var newNotificationRef = this.notificationsRef.push();
        data.user_key = user_key;
        data.timestamp = new Date().getTime();            
        data.nickname = userNickname;
        newNotificationRef.set(data);
        var self = this;
        setTimeout(function() {
            self.removeNotification(newNotificationRef);
        }, 5000);
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
            console.log("new user: ", key, " nickname: ", user_data.nickname);
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

    imagesRef.on('child_added', this.imageChildAdded, function(){}, this);
    usersRef.on('child_added', this.userChildChanged, function(){}, this);
    usersRef.on('child_changed', this.userChildChanged, function(){}, this);
    commentsRef.on('child_added', this.commentChildAdded, function(){}, this);

}


conferencesRef.on('child_added', function(snapshot){
    var key = snapshot.name();
    var conference_data = snapshot.val();
    
    if (conference_data.servername == config.serverName) {
        console.log("monitoring conference ", key, " ", conference_data.name);
        Globals.conferences[key] = new ConferenceObject(key, conferencesPath + "/" + key);
    }
    
});

var serverPath = config.firebaseRoot + "/servers/" + config.serverName;
var serverRef = new Firebase(serverPath);

// set regular interval to write cloudinary signature
function writeCloudinarySignature() {
    console.log("writing cloudinary signature for " + config.serverName);
    var params = {timestamp: new Date().getTime().toString()};
    var signature = cloudinary.utils.sign_request(params, {});
    serverRef.set({cloudinary_signature: signature});
}

writeCloudinarySignature();
setInterval(writeCloudinarySignature, 1000 * 60 * 15);