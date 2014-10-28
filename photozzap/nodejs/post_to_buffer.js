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

/*
BufferApp.prototype.getUserFromToken = function(accessToken) {
	var oauth2 = this._oauth2Options;
	return new BufferUser(accessToken, oauth2.api_base);
};
*/

// obtain access token from https://bufferapp.com/developers/apps
var bufferapp = new BufferApp({
    clientID : "544c6557c64066d84e38d761",
    clientSecret : "03e1ad5d6e693729c54d6fae04784539",
    callbackURL : "urn:ietf:wg:oauth:2.0:oob"
});

var bufferAccessToken = "1/34698604507dde4810e26d0e29c93405";


// var user = new BufferUser(access_token, oauth2.api_base);
// var user = bufferapp.getUserFromToken(bufferAccessToken);
// var user = BufferApp.BufferUser(bufferAccessToken, bufferapp.api_base);
var user = new BufferUser(bufferAccessToken, 'https://api.bufferapp.com/1');

console.log("user: ", user);

/*
user.getAllProfiles(function(error, profiles){
    console.log("profiles: ", profiles);
});
*/

var photozzapId = '54119ce618070b071eb3ae64';

user.createStatus('test update', [photozzapId], false, false, false, {}, null, 
function(error, new_status) {
    console.log("posted status ", new_status);
});

/*
user.getProfile('54119ce618070b071eb3ae64', // this is the photozzap profile
function(error, profile) {
    console.log("profile: ", profile);
});
*/