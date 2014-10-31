var express = require('express')
, app = express()
,BufferApp = require('node-bufferapp'),
 BufferUser = require('node-bufferapp/lib/bufferuser.js').BufferUser;

var Firebase = require('firebase');
var cloudinary = require('cloudinary');
var _ = require('underscore');

var config = require('./' + process.argv[2]);
var conferenceKey = process.argv[3];


cloudinary.config({ 
  cloud_name: 'photozzap', 
});


var bufferAccessToken = config.bufferAccessToken;
var user = new BufferUser(bufferAccessToken, 'https://api.bufferapp.com/1');

/*
// get all profiles
user.getAllProfiles(function(error, profiles){
    console.log("profiles: ", profiles);
});
*/


/*
user.createStatus('test update 2', [config.bufferProfileId], false, false, false, {}, null, 
function(error, new_status) {
    console.log("posted status ", new_status);
});
*/

// subscribe to the conference
var conferencePath = config.firebaseRoot + "/conferences/" + conferenceKey;
var conferenceRef = new Firebase(conferencePath);
conferenceRef.once('value', function(snapshot) {
    var confData = snapshot.val();
    
    // console.log("confData: ", confData);
    var conference_url = confData.url;
    
    // var image_array = [];
    var images = {};
    _.each(confData.images, function(image_data) {
        //console.log("image_data: ", image_data);
        images[image_data.id] = {id: image_data.id};
    });
    
    // merge in comment text
    _.each(confData.comments, function(comment_data) {
        if (comment_data.text.length > 95) {
            throw "comment too long: [" + comment_data.text + "]";
        }
        images[comment_data.image_id].text = comment_data.text;
    });
    
    // image ids and comments merged together, convert to an array
    var images_array = _.values(images);
    
    // merge in image urls
    images_array = _.map(images_array, function(image_data) {
        return {id: image_data.id,
                text: image_data.text,
                picture: cloudinary.url(image_data.id + ".jpg", {crop: 'fit', width: 2048, height: 2048}),
                thumbnail: cloudinary.url(image_data.id + ".jpg", {crop: 'fit', width: 400, height: 400}),
                };
    });
    
    console.log("images: ", images_array);
    
    // now post all images to buffer
    _.each(images_array, function(image_data) {
        var update_text = image_data.text + ". Click for HD Pics: " + conference_url;
        user.createStatus(update_text, [config.bufferProfileId], true, false, false, 
                          {picture: image_data.picture, thumbnail: image_data.thumbnail}, null, 
        function(error, new_status) {
            console.log("posted status ", new_status);
        });        
    });
    
});
