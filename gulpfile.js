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

var bower_glob = './bower_components/**/*';
var app_glob = './app/**/*';
var html_file = './app/index.html';
var html_templates = './app/partials/*.html';
var build_dir = 'dist'

gulp.task('default', ['webserver_debug'], function() {
});


gulp.task('build', ['templates'], function() {
    return gulp.src(html_file)
    .pipe(useref({searchPath: ['./app/', '.']}))
    .pipe(gulpif('*.js', uglify()))
    .pipe(gulpif('*.css', minifyCss()))    
    .pipe(gulp.dest(build_dir));
});

gulp.task('templates', function() {
   return gulp.src(html_templates)
   .pipe(templateCache())
   .pipe(gulp.dest(build_dir));
});

gulp.task('watch_copy_debug', function() {
    gulp.src([app_glob])
    .pipe(watch(app_glob))
    .pipe(debug({title: "updated"}))
    .pipe(gulp.dest('debug'));
});


gulp.task('webserver_debug', ['watch_copy_debug'], function() {
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

