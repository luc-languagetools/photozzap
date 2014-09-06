var cloudinary = require('cloudinary');
var config = require('./' + process.argv[2]);

cloudinary.config({ 
  cloud_name: config.cloudinaryName, 
  api_key: config.cloudinaryApiKey, 
  api_secret: config.cloudinaryApiSecret
});

var download_link = cloudinary.uploader.multi("db2SGI-Download-photos-test-1", function(result){
    console.log("result: ", result);
}, {format: "zip"});
console.log(download_link);