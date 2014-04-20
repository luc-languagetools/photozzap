
conference_javascript_files = [
"static/jquery/jquery-1.10.2.min.js",
"static/bootstrap3/js/bootstrap.min.js",
"static/angular/angular.min.js",
"static/angular/angular-touch.min.js",
"static/angular/angular-animate.min.js",
"static/angular/ui-bootstrap-tpls-0.10.0.min.js",
"static/angular-carousel/angular-carousel.js",
"static/jquery-libs/jquery-visibility.js",
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

# angular moment
"static/angular-moment/moment.min.js",
"static/angular-moment/angular-moment.min.js",

"static/conference/conference-ui.js",
"static/conference/conference-controller.js",
"static/conference/conference-initialize.js",
]

combined_conference_javascript_file = "static/combined/conference-all.min.js"

# files which must be displayed under any media queries
conference_css_files = [
"static/bootstrap3/css/bootstrap.min.css",
"static/bootstrap3/css/bootstrap-theme.min.css",
"static/conference/default.css",
"static/angular-carousel/angular-carousel.css",
"static/icomoon/style.css",
]

combined_conference_css_file = "static/combined/conference-all.css"

cdn_asset_list = []
cdn_asset_list.append(combined_conference_javascript_file)
cdn_asset_list.append(combined_conference_css_file)


