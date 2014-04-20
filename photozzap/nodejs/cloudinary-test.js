var cloudinary = require('cloudinary');

cloudinary.config({ 
  cloud_name: 'photozzap', 
  api_key: '751779366151643', 
  api_secret: 'OxGxJe0f-jGo1BAsmmlDdRPb7NM' 
});

var params = {timestamp: new Date().getTime().toString()};
var signature = cloudinary.utils.sign_request(params, {});
// signature.timestamp = new Date().getTime();            
console.log(signature);