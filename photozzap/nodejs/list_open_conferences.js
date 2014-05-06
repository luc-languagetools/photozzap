var Firebase = require('firebase');
var config = require('./' + process.argv[2]);


var conferencesPath = config.firebaseRoot + "/conferences";
var conferencesRef = new Firebase(conferencesPath);
conferencesRef.auth(config.firebaseSecret);

conferencesRef.on('child_added', function(snapshot){
    var key = snapshot.name();
    var conference_data = snapshot.val();
    
    if (conference_data.status != "closed") {
        console.log("conference open on [", conference_data.servername, "]: [", key, "]");
    }
    
});

