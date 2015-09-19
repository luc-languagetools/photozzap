var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var debug = require('gulp-debug');

// var js_path = './photozzap/static/*/**.js';
var js_path = './photozzap/static/**/*.js';

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

