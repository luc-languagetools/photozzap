var express = require('express')
, app = express()
,BufferApp = require('node-bufferapp'),
 BufferUser = require('node-bufferapp/lib/bufferuser.js').BufferUser;

var cloudinary = require('cloudinary');
var config = require('./' + process.argv[2]);

cloudinary.config({ 
  cloud_name: config.cloudinaryName, 
  api_key: config.cloudinaryApiKey, 
  api_secret: config.cloudinaryApiSecret
});

var bufferAccessToken = config.bufferAccessToken;
var user = new BufferUser(bufferAccessToken, 'https://api.bufferapp.com/1');

/*
// get all profiles
user.getAllProfiles(function(error, profiles){
    console.log("profiles: ", profiles);
});
*/


user.createStatus('test update 2', [config.bufferProfileId], false, false, false, {}, null, 
function(error, new_status) {
    console.log("posted status ", new_status);
});

