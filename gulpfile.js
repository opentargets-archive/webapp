
var gulp   = require('gulp');
var ignore = require('gulp-ignore');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var watch = require('gulp-watch');
var karma = require("karma").server;

// a failing test breaks the whole build chain
gulp.task('default', ['lint', 'test']);

gulp.task('lint', function() {
    return gulp.src('app/js/**/*.js')
	.pipe(ignore.exclude(/bower_components/))
	.pipe(ignore.exclude(/node_modules/))
	.pipe(ignore.exclude(/test/))
	.pipe(jshint())
	.pipe(jshint.reporter('default'));
});

// gulp.task('test', function (done) {
//     gulp.src('./karma.conf.js')
// 	.pipe(karma.start({
// 	    configFile: __dirname + '/karma.conf.js',
// 	}, function () {
// 	    done();
// 	}));
// });

gulp.task('test', function(done) {
    karma.start({
	configFile: __dirname + '/karma.conf.js',
	singleRun: true
    }, function() {
	done();
    });
});

gulp.task('watch', function() {
    gulp.watch(['./app/js/*.js', './test/*.js'], ['test', 'lint']);
});

