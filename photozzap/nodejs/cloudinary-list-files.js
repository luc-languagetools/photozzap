var cloudinary = require('cloudinary');
var config = require('./' + process.argv[2]);

cloudinary.config({ 
  cloud_name: config.cloudinaryName, 
  api_key: config.cloudinaryApiKey, 
  api_secret: config.cloudinaryApiSecret
});

var current_timestamp =  new Date().getTime();
//        if (current_timestamp - comment_data.time_added < 120000 &&
var min_diff = 24*60*60 * 14; // more than 7 days old

var image_ids_to_delete = [];

cloudinary.api.resources(function(result)  { 
	// console.log(result);
	var results = result.resources;
	for(var i = 0; i < results.length; i++) {
		var entry = results[i];
		var created_at_date = new Date(entry.created_at);
		var time_diff = current_timestamp - created_at_date;
		if (time_diff > min_diff && 
		    (entry.tags.indexOf("prod") > -1 ||
		     entry.tags.indexOf("test") > -1 ||
		     entry.tags.indexOf("dev") > -1)) { // prod, test or dev images more than a week old
			console.log("scheduled for deletion: public_id: ", entry.public_id, " created_at: ", entry.created_at, " tags: ", entry.tags);
			
			image_ids_to_delete.push(entry.public_id);
			
		} else {
			console.log("image doesn't match criteria: ", entry.public_id, " created_at: ", entry.created_at,
			" time_diff: ", time_diff, " min_diff: ", min_diff, " entry: ", entry);
		}
		//console.log(entry);
		
	}	
		
	var delete_old_images = false;
	if (delete_old_images) {
		console.log("public_ids scheduled for deletion: ", image_ids_to_delete);
			
		cloudinary.api.delete_resources(image_ids_to_delete, function(result){
			console.log(result);
		});
	} else {
		console.log("not deleting, image ids: ", image_ids_to_delete);
	}		

	
}, {tags: true, direction: "asc", max_results: 50});



