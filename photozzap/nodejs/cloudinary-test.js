var cloudinary = require('cloudinary');

cloudinary.config({ 
  cloud_name: 'photozzap', 
  api_key: '751779366151643', 
  api_secret: 'OxGxJe0f-jGo1BAsmmlDdRPb7NM' 
});

var signature = cloudinary.utils.sign_request({}, {});
console.log(signature);