var gulp = require('gulp');
var uglify = require('gulp-uglify');
var debug = require('gulp-debug');

var js_path = 'photozzap/static/**/*.js';

gulp.task('default', function() {
  gulp.src(js_path)
  .pipe(debug());
});



gulp.task('scripts', function() {
  gulp.src(js_path)
  .pipe(uglify())
  .pipe(gulp.dest('dist'));
});

