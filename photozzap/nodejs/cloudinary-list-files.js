var cloudinary = require('cloudinary');
var config = require('./' + process.argv[2]);

cloudinary.config({ 
  cloud_name: config.cloudinaryName, 
  api_key: config.cloudinaryApiKey, 
  api_secret: config.cloudinaryApiSecret
});

var current_timestamp =  new Date().getTime();
//        if (current_timestamp - comment_data.time_added < 120000 &&
var min_diff = 24*60*60 * 30 * 3;

cloudinary.api.resources(function(result)  { 
	// console.log(result);
	var results = result.resources;
	for(var i = 0; i < results.length; i++) {
		var entry = results[i];
		var created_at_date = new Date(entry.created_at);
		var time_diff = current_timestamp - created_at_date;
		if (time_diff > min_diff && entry.tags.length == 0) {
			console.log("public_id: ", entry.public_id, " created_at: ", entry.created_at, " tags: ", entry.tags);
			
			var delete_old_images = false;
			if (delete_old_images) {
				cloudinary.api.delete_resources([entry.public_id], function(result){
					console.log(result);
				});
			}
			
			
		} else {
			console.log("image doesn't match criteria: ", entry.public_id, " created_at: ", entry.created_at,
			" time_diff: ", time_diff, " min_diff: ", min_diff, " entry: ", entry);
		}
		//console.log(entry);
	}
}, {tags: true, direction: "asc", max_results: 100});

