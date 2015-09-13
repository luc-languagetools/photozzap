
conference_javascript_files = [
"static/jquery/jquery-1.10.2.min.js",
"static/bootstrap3/js/bootstrap.min.js",
"static/angular/angular.js",
"static/angular/angular-animate.js",
"static/angular/angular-touch.js",
"static/angular/ui-bootstrap-tpls-0.10.0.min.js",
"static/angular-carousel/angular-carousel.js",
"static/jquery-libs/jquery-visibility.js",
"static/jquery-libs/md5.js",
"static/jquery-libs/jquery.browser-fingerprint-1.1.js",
"static/jquery-libs/underscore-min.js",

# photoswipe
"static/photoswipe/photoswipe.js",
"static/photoswipe/photoswipe-ui-default.js",

# masonry
"static/masonry/masonry.pkgd.js",
"static/masonry/angular-masonry.js",
"static/masonry/imagesloaded.pkgd.js",

# cloudinary files
"static/cloudinary/jquery.ui.widget.js",
"static/cloudinary/jquery.iframe-transport.js",
"static/cloudinary/jquery.fileupload.js",
"static/cloudinary/jquery.cloudinary.js",

# upload care
"static/uploadcare/uploadcare.full.min.js",

# firebase
"static/firebase/firebase.js",
"static/firebase/angularfire.min.js",

# angular moment
"static/angular-moment/moment.min.js",
"static/angular-moment/angular-moment.min.js",

"static/conference/conference-ui.js",
"static/conference/conference-init-services.js",
"static/conference/conference-config.js",
"static/conference/conference-service-photozzap.js",
"static/conference/conference-controller-home.js",
"static/conference/conference-controller-nick-change.js",
"static/conference/conference-controller-photozzap.js",
"static/conference/conference-controller-thumbnails.js",
"static/conference/conference-controller-photoswipethumbnails.js",
"static/conference/conference-controller-follow.js",
"static/conference/conference-controller-chat.js",
"static/conference/conference-controller-upload.js",
"static/conference/conference-controller-download.js",
"static/conference/conference-directives.js",
"static/conference/conference-initialize.js",
]

home_javascript_files = conference_javascript_files

conference_css_files = [
"static/bootstrap3/css/bootstrap.min.css",
"static/bootstrap3/css/bootstrap-theme.min.css",
"static/conference/default.css",
"static/angular-carousel/angular-carousel.css",
"static/icomoon/style.css",
"static/photoswipe/photoswipe.css",
"static/photoswipe/default-skin.css",
]

home_css_files = [
"static/bootstrap3/css/bootstrap.min.css",
"static/bootstrap3/css/bootstrap-theme.min.css",
"static/icomoon/style.css",
]

# should be copied as-is to CDN directory
other_static_assets = [
"static/icomoon/icomoon.eot",
"static/icomoon/icomoon.svg",
"static/icomoon/icomoon.ttf",
"static/icomoon/icomoon.woff",
"static/letter_p.png",
"static/preloader.gif",
]

combined_conference_javascript_file = "static/cdn-files/conference-all.min.js"
combined_conference_css_file = "static/cdn-files/conference-all.css"

combined_home_javascript_file = "static/cdn-files/home-all.min.js"
combined_home_css_file = "static/cdn-files/home-all.css"

home_file_path = "static/cdn-files/index.html"
conference_file_path = "static/cdn-files/conference.html"

cdn_asset_list = []
cdn_asset_list.append(combined_conference_javascript_file)
cdn_asset_list.append(combined_conference_css_file)
cdn_asset_list.append(combined_home_javascript_file)
cdn_asset_list.append(combined_home_css_file)
cdn_asset_list.extend(other_static_assets)
cdn_asset_list.append(home_file_path)
cdn_asset_list.append(conference_file_path)



