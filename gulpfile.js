
var gulp   = require('gulp');
var ignore = require('gulp-ignore');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var watch = require('gulp-watch');
var karma = require("karma").server;
var protractor = require("gulp-protractor").protractor;
var uglify = require('gulp-uglify');
var browserify = require('gulp-browserify');
var sass = require('gulp-sass');
var csspurge = require('gulp-css-purge');

var gzip = require('gulp-gzip');
var del = require("del");
var rename = require('gulp-rename');
var buildDir = "app/build";
var browserFile = "browser.js";
var packageConfig = require("./package.json");
var outputFile = packageConfig.name;

// path tools
var path = require('path');
var join = path.join;
var mkdirp = require('mkdirp');

// auto config for browserify
var outputFileSt = outputFile + ".js";
var outputFilePath = join(buildDir,outputFileSt);
var outputFileMinSt = outputFile + ".min.js";
var outputFileMin = join(buildDir,outputFileMinSt);

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

gulp.task('unitTest', function (done) {
    karma.start({
	configFile: __dirname + '/karma.conf.js',
	singleRun: true
    }, function() {
	done();
    });
});


gulp.task('e2eTest', function () {
    gulp.src(["./test/e2e/*.js"])
        .pipe(protractor({
	    configFile: "protractor.conf.js"
	}))
        .on('error', function(e) { throw e })
});

//gulp.task('test', ['unitTest', 'e2eTest']);
gulp.task('test', ['unitTest']);

gulp.task('watch', function() {
    gulp.watch(['./app/js/*.js', './test/*.js', './components/diseaseGraph/src/*.js'], ['build-browser','test']);
});


// will remove everything in build
gulp.task('clean', function (cb) {
    del ([buildDir], cb);
});

// just makes sure that the build dir exists
gulp.task('init', ['clean'], function() {
    mkdirp(buildDir, function (err) {
	if (err) console.error(err)
    });
});

// sass-import
gulp.task('sass', function () {
    return gulp.src("index.scss")
        .pipe(sass({
	    errLogToConsole: true
	}))
	.pipe(csspurge())
	.pipe(rename(outputFile + '.css'))
        .pipe(gulp.dest(buildDir));
});

// browserify debug
gulp.task('build-browser',['init', 'sass'], function() {
    return gulp.src(browserFile)
	.pipe(browserify({debug:true}))
	.pipe(rename(outputFileSt))
	.pipe(gulp.dest(buildDir));
});

// browserify min
gulp.task('build-browser-min',['init', 'sass'], function() {
    return gulp.src(browserFile)
	.pipe(browserify({}))
	.pipe(uglify())
	.pipe(rename(outputFileMinSt))
	.pipe(gulp.dest(buildDir));
});

gulp.task('build-browser-gzip', ['build-browser-min'], function() {
    return gulp.src(outputFileMin)
        .pipe(gzip({append: false, gzipOptions: { level: 9 }}))
        .pipe(rename(outputFile + ".min.gz.js"))
        .pipe(gulp.dest(buildDir));
});

