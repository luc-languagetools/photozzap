var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var debug = require('gulp-debug');
var inject = require('gulp-inject');
var webserver = require('gulp-webserver');
var gulp_filter = require('gulp-filter');
var watch = require('gulp-watch');
var debug = require('gulp-debug');
var useref = require('gulp-useref');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-minify-css');
var templateCache = require('gulp-angular-templatecache');
var inject = require('gulp-inject');
var cachebust = require('gulp-cache-bust');
var ngconstant = require('gulp-ng-constant');
var rename = require('gulp-rename');

var angular_modulename = "photozzap";
var angular_config_template = "./app/config-template.ejs";
var angular_config_dest = "./angular_config_generated/";

var bower_glob = './bower_components/**/*';
var app_glob = ['./app/**/*', './angular_config_generated/angular-config.js'];
var html_file = './app/index.html';
var html_templates = './app/partials/*.html';
var build_dir = 'dist'

var assets_glob = ['./graphics/*',
'./app/js/icomoon/*.{eot,svg,ttf,woff}',
'./app/js/photoswipe/*.{png,svg,gif}'
];

gulp.task('default', ['webserver_debug'], function() {
});


gulp.task('build_serve', ['build'], function() {
    gulp.src(build_dir)
    .pipe(webserver({
            directoryListing: {path: build_dir,
                               enable: true},
            open: true,
            host: '0.0.0.0',
            port: process.env.PORT,        
    }));
})

gulp.task('build', ['config', 'templates', 'assets'], function() {
    return gulp.src(html_file)
    .pipe(useref({searchPath: ['./app/', './angular_config_generated/', '.']}))
    .pipe(gulpif('*.js', uglify()))
    .pipe(gulpif('*.css', minifyCss()))
    .pipe(gulpif('index.html', inject(gulp.src('./dist/templates.js', {read: false}), {ignorePath: build_dir, addRootSlash: false})))
    .pipe(cachebust())
    .pipe(gulp.dest(build_dir));
});

gulp.task('templates', function() {
   return gulp.src(html_templates)
   .pipe(templateCache({root: 'partials/', module: "conferenceModule"}))
   .pipe(gulp.dest(build_dir));
});

gulp.task('assets', function() {
    return gulp.src(assets_glob)
    .pipe(gulp.dest(build_dir))
});

gulp.task('config', function() {
  var environment = process.env.ENVIRONMENT;
  if(!environment) {
      throw "ENVIRONMENT not set [ENVIRONMENT=dev]";
  }
  var fb_root = process.env.FB_ROOT;
  if(!fb_root) {
    throw "FB_ROOT not set [FB_ROOT=photozzap2-dev.firebaseio.com]";
  }
  var constants = {"firebaseRoot": 'https://' + fb_root + '/',
                   "environment": environment};
  ngconstant({
      name: angular_modulename,
      templatePath: angular_config_template,
      constants: constants,
      stream: true
    })
    .pipe(rename("angular-config.js"))
    .pipe(gulp.dest(angular_config_dest));
});

gulp.task('watch_copy_debug', function() {
    gulp.src(app_glob)
    .pipe(watch(app_glob))
    .pipe(debug({title: "updated"}))
    .pipe(gulp.dest('debug'));
});


gulp.task('webserver_debug', ['config', 'watch_copy_debug'], function() {
    gulp.src('./debug/')
        .pipe(webserver({
            livereload: {enable: true,
                         port: 8081
            },
            directoryListing: {path: 'debug',
                               enable: true},
            open: true,
            host: '0.0.0.0',
            port: process.env.PORT,
        }));
});

