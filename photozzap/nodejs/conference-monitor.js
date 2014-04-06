var Firebase = require('firebase');

var Globals = {
    firebaseRoot: "https://fiery-fire-5557.firebaseio.com",
    serverName: "dev-01",
    secret: "EcO3bQl1ZvURjixUXhjdDqc0YsJBvh46h1DJxKsq",
    conferences: {},
}

var conferencesPath = Globals.firebaseRoot + "/conferences";
var conferencesRef = new Firebase(conferencesPath);
conferencesRef.auth(Globals.secret);


function ConferenceObject(key, path) {
    console.log("ConferenceObject path: ", path);
    this.key = key;
    this.path = path;
    
    this.user_cache = {};
    
    var imagesPath = path + "/images";
    var imagesRef = new Firebase(imagesPath);
    
    var usersPath = path + "/users";
    var usersRef = new Firebase(usersPath);

    this.log_event = function(message) {
        console.log((new Date()).toUTCString(), ": [", this.key ,"] ", message);
    };
    
    this.log_user_event = function(user_key, message) {
        this.log_event(user_key + ": " + message);
    };
    
    this.imageChildAdded = function(snapshot) {
        console.log("conference ", this.key, ": image added");
    };   

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
            } else if (this.user_cache[key].connected == true &&
                       user_data.connected == false) 
            {
                this.log_user_event(key, "disconnected");
            }
            
            // is user away ?
            if (this.user_cache[key].page_visible == false &&
                user_data.page_visible == true) {
                this.log_user_event(key, "is back");
            } else if (this.user_cache[key].page_visible == true &&
                user_data.page_visible == false) {
                this.log_user_event(key, "is away");
            }
            
            // user watching different picture ?
            if (this.user_cache[key].viewing_image_id != user_data.viewing_image_id) {
                this.log_user_event(key, "viewing image " + user_data.viewing_image_id);
            }
        }
        
        this.user_cache[key] = user_data;
    };

    imagesRef.on('child_added', this.imageChildAdded, function(){}, this);
    usersRef.on('child_added', this.userChildChanged, function(){}, this);
    usersRef.on('child_changed', this.userChildChanged, function(){}, this);
   

}


conferencesRef.on('child_added', function(snapshot){
    var key = snapshot.name();
    var conference_data = snapshot.val();
    
    if (conference_data.servername == Globals.serverName) {
        console.log("monitoring conference ", key, " ", conference_data.name);
        Globals.conferences[key] = new ConferenceObject(key, conferencesPath + "/" + key);
    }
    
});
