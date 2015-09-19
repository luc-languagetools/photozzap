var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var debug = require('gulp-debug');
var inject = require('gulp-inject');
var webserver = require('gulp-webserver');

// var js_path = './photozzap/static/*/**.js';
var js_path = './src/**/*.js';

gulp.task('default', function() {
  return gulp.src(js_path)
  .pipe(debug());
});


gulp.task('scripts', function() {
  return gulp.src(js_path)
  .pipe(concat('all.min.js'))
  .pipe(uglify())
  .pipe(gulp.dest('dist'));
});


gulp.task('copy_icons', function() {
    return gulp.src('./src/icomoon/icomoon.*')
    .pipe(gulp.dest('debug/app/icomoon'));
});

gulp.task('copy_js_css_debug', function() {
    return gulp.src(['./src/**/*.js', './src/**/*.css'])
    .pipe(gulp.dest('debug/app'));
});

// inject JS and CSS assets into JS
gulp.task('build_html_debug', ['copy_js_css_debug', 'copy_icons'], function() {
    var target = gulp.src('./html/home.html');
    var sources = gulp.src(['./debug/app/**/*.js', './debug/app/**/*.css'], {read: false});
    
    return target.pipe(inject(sources, {ignorePath: 'debug'}))
        .pipe(gulp.dest('./debug'));    
});

gulp.task('webserver', ['build_html_debug'], function() {
    gulp.src('debug')
        .pipe(webserver({
            livereload: false,
            directoryListing: {enable: true,
                               path: 'debug'},
            open: true,
            host: '0.0.0.0',
            port: 8000,
        }));
});