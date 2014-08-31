var Firebase = require('firebase');
var config = require('./' + process.argv[2]);


var conferencesPath = config.firebaseRoot + "/conferences";
var conferencesRef = new Firebase(conferencesPath);
conferencesRef.auth(config.firebaseSecret);

conferencesRef.on('child_added', function(snapshot){
    var key = snapshot.name();
    var conference_data = snapshot.val();
    
    if (conference_data.status != "closed" && conference_data.bitcoin_address != undefined) {
        console.log("conference open on [", 
                    conference_data.servername, 
                    "]: [", 
                    key, "] bitcoin [",
                    conference_data.bitcoin_address,
                    "] views [",
                    conference_data.views,
                    "] bitcoin status [",
                    conference_data.bitcoin_status,
                    "]");
        // console.log(conference_data.users);
        for (var user_key in conference_data.users) {
            var user = conference_data.users[user_key];
            console.log("    ip %s fingerprint %s ip_info %j", user.user_ip, user.fingerprint, user.ip_info);
        }
    }
    
});

