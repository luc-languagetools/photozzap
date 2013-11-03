
javascript_files = [
"static/jquery/jquery-1.10.2.min.js",
"static/jquery-ui/jquery-ui.min.js",
"static/slimscroll/jquery.slimscroll.js",
"static/bootstrap/js/bootstrap.min.js",
"static/strophe/strophe.min.js",
"static/angular/angular.min.js",
"static/jslibs/jquery.jqote2.js",
"static/jslibs/holder.js",
"static/timeago/jquery.timeago.js",
"static/transit/jquery.transit.min.js",
"static/modernizr/modernizr.touch.min.js",
"static/ajaxq/jquery.ajaxq-0.0.1.js",
# cloudinary files
"static/cloudinary/jquery.ui.widget.js",
"static/cloudinary/jquery.iframe-transport.js",
"static/cloudinary/jquery.fileupload.js",
"static/cloudinary/jquery.cloudinary.js",

"static/conference/conference-net.js",
"static/conference/conference-ui.js",
"static/conference/conference-controls.js",
"static/conference/conference-controller.js",
"static/conference/conference-initialize.js",
]

combined_javascript_file = "static/combined/all.min.js"

# files which must be displayed under any media queries
css_files = [
"static/bootstrap/css/bootstrap.min.css",
"static/bootstrap/css/bootstrap-responsive.min.css",
"static/conference/default.css",
"static/conference/small.css",
"static/conference/small-landscape.css",
]

combined_css_file = "static/combined/all.css"

icon_files = {
'eye_gray': "static/icons/eye_gray.png",
'upload_gray': "static/icons/upload_gray.png",
'comment_small_gray': "static/icons/comment_small_gray.png",
'comment_big_white': "static/icons/comment_big_white.png",
'comment_medium_darkgray': "static/icons/comment_medium_darkgray.png",
'gallery_medium_white': "static/icons/gallery_medium_white.png",
'clock_medium_white': "static/icons/clock_medium_white.png",
'photozzap_header': "static/icons/photozzap_header.png",
'upload_photo_white': "static/icons/upload_photo_white.png",
'users_medium_white': "static/icons/users_medium_white.png",
'chat_medium_white': "static/icons/chat_medium_white.png",
}

cdn_asset_list = []
cdn_asset_list.append(combined_javascript_file)
cdn_asset_list.append(combined_css_file)
cdn_asset_list.extend(icon_files.values())

