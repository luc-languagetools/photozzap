
javascript_files = [
"static/jquery/jquery-1.10.2.min.js",
"static/jquery-ui/jquery-ui.min.js",
"static/slimscroll/jquery.slimscroll.js",
"static/bootstrap3/js/bootstrap.min.js",
# "static/angular/angular.min.js",
"static/angular/angular.js",
#"static/angular/angular-touch.min.js",
"static/angular/angular-touch.js",
"static/angular/angular-animate.min.js",
"static/angular/ng-mobile.js",
"static/angular/ui-bootstrap-tpls-0.10.0.min.js",
"static/angular-carousel/angular-carousel.js",
"static/jslibs/jquery.jqote2.js",
"static/jslibs/holder.js",
"static/timeago/jquery.timeago.js",
"static/transit/jquery.transit.min.js",
"static/touchswipe/jquery.touchSwipe.min.js",
"static/modernizr/modernizr.touch.min.js",
"static/ajaxq/jquery.ajaxq-0.0.1.js",
# cloudinary files
"static/cloudinary/jquery.ui.widget.js",
"static/cloudinary/jquery.iframe-transport.js",
"static/cloudinary/jquery.fileupload.js",
"static/cloudinary/jquery.cloudinary.js",
"static/cloudinary/load-image.min.js",
"static/cloudinary/canvas-to-blob.min.js",
"static/cloudinary/jquery.fileupload-process.js",
"static/cloudinary/jquery.fileupload-image.js",
"static/cloudinary/jquery.fileupload-validate.js",

# firebase
"static/firebase/firebase.js",
"static/firebase/firebase-simple-login.js",
"static/firebase/angularfire.min.js",

"static/conference/conference-net.js",
"static/conference/conference-ui.js",
"static/conference/conference-controls.js",
"static/conference/conference-controller.js",
"static/conference/conference-initialize.js",
]

combined_javascript_file = "static/combined/all.min.js"

# files which must be displayed under any media queries
css_files = [
"static/bootstrap3/css/bootstrap.min.css",
"static/bootstrap3/css/bootstrap-theme.min.css",
"static/conference/default.css",
"static/conference/small.css",
"static/conference/small-landscape.css",
"static/angular-carousel/angular-carousel.css",
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
'slide_left_white': "static/icons/slide_left_white.png",
'slide_right_white': "static/icons/slide_right_white.png",
'slide_down_white': "static/icons/slide_down_white.png",
'slide_up_white': "static/icons/slide_up_white.png",
'prev': "static/icons/prev.png",
'next': "static/icons/next.png",
'photozzap_logo': "static/icons/photozzap_logo.png",
'swipe': "static/icons/swipe.png",
'menu': "static/icons/menu.png",
'pointer': "static/icons/pointer.png",
}

cdn_asset_list = []
cdn_asset_list.append(combined_javascript_file)
cdn_asset_list.append(combined_css_file)
cdn_asset_list.extend(icon_files.values())

