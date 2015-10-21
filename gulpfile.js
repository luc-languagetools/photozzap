var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var debug = require('gulp-debug');
var inject = require('gulp-inject');
var webserver = require('gulp-webserver');
var gulp_filter = require('gulp-filter');
var livereload = require('gulp-livereload');

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

gulp.task('bower_files_debug', function() {
    var filter = gulp_filter('**/*.js');
    return gulp.src('./bower.json')
        .pipe(main_bower_files())
        .pipe(filter)
        .pipe(concat('libs.js'))
        .pipe(gulp.dest('debug/lib'));
});

gulp.task('copy_graphics_debug', function(){
    return gulp.src(['./graphics/*'])
        .pipe(gulp.dest('debug'));
});

gulp.task('copy_lib_css_debug', function() {
    return gulp.src(['./bower_components/bootstrap/**/*.css', '!./bower_components/bootstrap/**/*.min.css'])
        .pipe(gulp.dest('debug/lib'));
});

gulp.task('copy_js_css_debug', function() {
    return gulp.src(['./src/**/*.js', './src/**/*.css'])
    .pipe(gulp.dest('debug/app'));
});

// inject JS and CSS assets into JS
gulp.task('build_html_debug', ['bower_files_debug', 'copy_js_css_debug', 'copy_lib_css_debug', 'copy_icons', 'copy_graphics_debug'], function() {
    
    

    var target = gulp.src('./html/*.html');
    var sources = gulp.src(['./debug/app/**/*.js', 
                            './debug/lib/**/*.css',
                            './debug/app/**/*.css'], {read: false});
    
    
    
    
    var stream1 = target.pipe(inject(sources, {ignorePath: 'debug'}))
        .pipe(gulp.dest('./debug'));    
        
    var filter = gulp_filter('**/*.js');        
    var stream2 = gulp.src('./bower.json')
        .pipe(main_bower_files())
        .pipe(filter)
        .pipe(gulp.dest('debug/lib'));
    
    return merge(stream2, stream1);
});



gulp.task('webserver_debug', function() {
    gulp.src('./')
        .pipe(webserver({
            livereload: true,
            directoryListing: {enable: true,
                               path: './'},
            open: true,
            host: '0.0.0.0',
            port: 8000,
        }));
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