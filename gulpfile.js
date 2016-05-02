var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var debug = require('gulp-debug');
var inject = require('gulp-inject');
var webserver = require('gulp-webserver');
var gulp_filter = require('gulp-filter');
var watch = require('gulp-watch');

var bower_glob = './bower_components/**/*';
var app_glob = './app/**/*';

gulp.task('default', ['webserver_debug'], function() {
});

gulp.task('watch_copy_bower_components', function() {
    gulp.src(bower_glob)
    .pipe(watch(bower_glob))
    .pipe(gulp.dest('debug/bower_components'));
});

gulp.task('watch_copy_debug', function() {
    gulp.src([app_glob])
    .pipe(watch(app_glob))
    .pipe(gulp.dest('debug'));
});


gulp.task('webserver_debug', ['watch_copy_bower_components', 'watch_copy_debug'], function() {
    gulp.src('./debug/')
        .pipe(webserver({
            livereload: {enable: false,
                         port: 8081},
            directoryListing: {path: 'debug',
                               enable: true},
            open: true,
            host: '0.0.0.0',
            port: process.env.PORT,
        }));
});

