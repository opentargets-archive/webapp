
var gulp   = require('gulp');
var ignore = require('gulp-ignore');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var watch = require('gulp-watch');
var karma = require("karma").server;
var uglify = require('gulp-uglify');
var closureCompiler = require('gulp-closure-compiler');

var browserify = require('gulp-browserify');
var sass = require('gulp-sass');
var csspurge = require('gulp-css-purge');

var gzip = require('gulp-gzip');
var del = require("del");
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var buildDir = "app/build";
var componentsConfig = "components.js";
var packageConfig = require("./package.json");

var componentsName = 'components-' + packageConfig.name;
var webappName = packageConfig.name;

// path tools
var path = require('path');
var join = path.join;
var mkdirp = require('mkdirp');


// Output Files and Paths
var webappFile = webappName + ".js";
var webappFileFull = join (buildDir, webappFile);
var webappFileMin = webappName + ".min.js";
var webappFileMinFull = join (buildDir, webappFileMin);
var webappFileGz = webappFileMin + "gz";

// components output
var componentsFile = componentsName + ".js";
var componentsFileFull = join (buildDir, componentsFile);
var componentsFileMin = componentsName + ".min.js";
var componentsFileMinFull = join (buildDir, componentsFileMin);
var componentsFileGz = componentsFileMin + ".gz";


// auto config for browserify
// var outputFileSt = outputFile + ".js";
// var outputFilePath = join(buildDir,outputFileSt);
// var outputFileMinSt = outputFile + ".min.js";
// var outputFileMin = join(buildDir,outputFileMinSt);
//
// var outputComponentsFileSt = outputComponentsFile + '.js';
// var outputComponentsMinSt = outputComponentsFile + '.min.js';

// angular uglify

var webappFiles = require ("./webappFiles.js");

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

//gulp.task('test', ['unitTest', 'e2eTest']);
gulp.task('test', ['unitTest']);

gulp.task('watch', function() {
    gulp.watch(['./app/js/*.js',
		'./test/*.js',
		'./components/diseaseGraph/src/*.js',
		'./components/targetGeneTree/src/*.js',
        './components/targetGenomeBrowser/src/*.js'
    ], ['build-components','test']);
});


// will remove everything in build
gulp.task('clean', function () {
    return del ([buildDir]);
});

// just makes sure that the build dir exists
gulp.task('init', ['clean'], function() {
    mkdirp(buildDir, function (err) {
        if (err) {
            console.error(err);
        }
    });
});

// sass-import
gulp.task('sass', function () {
    return gulp.src("components.scss")
        .pipe(sass({
	    errLogToConsole: true
	}))
	.pipe(csspurge())
	.pipe(rename(componentsName + '.css'))
        .pipe(gulp.dest(buildDir));
});

// browserify debug
gulp.task('build-components',['sass'], function() {
    return gulp.src(componentsConfig)
	.pipe(browserify({debug:true}))
	.pipe(rename(componentsFile))
	.pipe(gulp.dest(buildDir));
});

// browserify min
gulp.task('build-components-min',['build-components'], function() {
    return gulp.src(componentsFileFull)
	.pipe(uglify())
	.pipe(rename(componentsFileMin))
	.pipe(gulp.dest(buildDir));
});

gulp.task('build-components-gzip', ['build-browser-min'], function() {
    return gulp.src(componentsFileMinFull)
        .pipe(gzip({append: false, gzipOptions: { level: 9 }}))
        .pipe(rename(componentsFileGz))
        .pipe(gulp.dest(buildDir));
});

gulp.task('build-webapp', ['init', 'build-components-min'], function () {
    return gulp.src(webappFiles)
        // .pipe(closureCompiler({
        //     compilerPath: 'node_modules/google-closure-compiler/compiler.jar',
        //     fileName: webappFileMin
        // }))
        .pipe(sourcemaps.init({
            debug: true
        }))
        .pipe(concat(webappFileMin))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(buildDir));
});
