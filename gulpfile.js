var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var debug = require('gulp-debug');
var inject = require('gulp-inject');
var webserver = require('gulp-webserver');
var gulp_filter = require('gulp-filter');
var livereload = require('gulp-livereload');

gulp.task('default', ['webserver_debug'], function() {
});

gulp.task('copy_bower_components', function() {
    return gulp.src('./bower_components/**/*')
    .pipe(gulp.dest('debug/bower_components'));
});

gulp.task('copy_debug', function() {
    return gulp.src(['./app/**/*'])
    .pipe(gulp.dest('debug'));
});


gulp.task('webserver_debug', ['copy_bower_components', 'copy_debug'], function() {
    gulp.src('./app/')
        .pipe(webserver({
            livereload: true,
            directoryListing: {path: './app/',
                               enable: true},
            open: true,
            host: '0.0.0.0',
            port: 8000,
        }));
});

