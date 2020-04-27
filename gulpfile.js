var fs = require('fs');
var gulp   = require('gulp');
var ignore = require('gulp-ignore');
var jshint = require('gulp-jshint');
var watch = require('gulp-watch');
var uglify = require('gulp-uglify');
var server = require('gulp-server-livereload');

// var browserify = require('gulp-browserify');
var browserify = require('browserify');
var sass = require('gulp-sass');
var csspurge = require('gulp-css-purge');
var minifyCss = require('gulp-minify-css');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var babelify = require('babelify');

var gzip = require('gulp-gzip');
var del = require('del');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var jsonminify = require('gulp-jsonminify');
var merge = require('gulp-merge-json');
var replace = require('gulp-replace');

var through = require('through2');

var buildDir = 'app/build';
var componentsConfig = 'components.js';
var packageConfig = require('./package.json');

var componentsName = 'components-' + packageConfig.name;
var webappName = packageConfig.name;

// app config / initialization
var configDir = 'app/config';
var configSourceFiles = ['default.json', 'custom.json'];
var configMergedSources = 'combined.json';
var configFile = 'config.json';

// path tools
var path = require('path');
var join = path.join;
var mkdirp = require('mkdirp');


// Output Files and Paths
var webappFile = webappName + '.js';
var webappFileFull = join(buildDir, webappFile);
var webappFileMin = webappName + '.min.js';
var webappFileMinFull = join(buildDir, webappFileMin);
var webappFileGz = webappFileMin + 'gz';

// 3rd party
var webapp3rdparty = webappName + '-3rdParty.js';
var webapp3rdpartyFull = join(buildDir, webapp3rdparty);
var webapp3rdpartyMin = webapp3rdparty + '.min.js';
var webapp3rdpartyMinFull = join(buildDir, webapp3rdpartyMin);
var webapp3rdpartyCss = webappName + '-3rdParty.css';

// components output
var componentsFile = componentsName + '.js';
var componentsFileFull = join(buildDir, componentsFile);
var componentsFileMin = componentsName + '.min.js';
var componentsFileMinFull = join(buildDir, componentsFileMin);
var componentsFileGz = componentsFileMin + '.gz';


// auto config for browserify
// var outputFileSt = outputFile + ".js";
// var outputFilePath = join(buildDir,outputFileSt);
// var outputFileMinSt = outputFile + ".min.js";
// var outputFileMin = join(buildDir,outputFileMinSt);
//
// var outputComponentsFileSt = outputComponentsFile + '.js';
// var outputComponentsMinSt = outputComponentsFile + '.min.js';

// angular uglify

var webappFiles = require('./webappFiles.js');
var packageFile = require('./package.json');

// a failing test breaks the whole build chain
gulp.task('default', ['lint', 'test']);

gulp.task('lint', function () {
    return gulp.src('app/js/**/*.js')
        .pipe(ignore.exclude(/node_modules/))
        .pipe(ignore.exclude(/test/))
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('unitTest', function (done) {
    karma.start({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    }, function () {
        done();
    });
});

// gulp.task('test', ['unitTest', 'e2eTest']);
gulp.task('test', ['unitTest']);

// will remove everything in build
gulp.task('clean', function () {
    return del([buildDir]);
});

// just makes sure that the build dir exists
gulp.task('init', function () {
    mkdirp(buildDir, function (err) {
        if (err) {
            console.error(err);
        }
    });
});

// gulp.task ('build-docs', function () {
//     return gulp.src("app/docs/*.md")
//         .pipe(markdown())
//         .pipe(gulp.dest("app/docs/"));
// });

// sass-import
gulp.task('components-sass', function () {
    return gulp.src('components.scss')
        .pipe(sass({
            errLogToConsole: true
        }))
        .pipe(csspurge())
        .pipe(sourcemaps.init())
        .pipe(minifyCss({compatibility: 'ie9'}))
        .pipe(rename(componentsName + '.min.css'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(buildDir));
});

// browserify debug
// gulp.task('build-components',['components-sass'], function() {
//     return gulp.src(componentsConfig)
// 	.pipe(browserify({debug:true}))
// 	.pipe(rename(componentsFile))
// 	.pipe(gulp.dest(buildDir));
// });

gulp.task('build-components', ['components-sass'], function () {
    return browserify({
        entries: componentsConfig,
        debug: true
    })
        .bundle()
        .pipe(source(componentsFile))
        .pipe(buffer())
        // .pipe(sourcemaps.init({loadMaps: true}))
        // .pipe(uglify())
        // .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(buildDir))
        .pipe(gutil.noop());
});


// browserify min
gulp.task('build-components-min', ['build-components'], function () {
    return gulp.src(componentsFileFull)
        .pipe(rename(componentsFileMin))
        .pipe(sourcemaps.init({
            debug: true
        }))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(buildDir));
});

gulp.task('build-components-gzip', ['build-components-min'], function () {
    return gulp.src(componentsFileMinFull)
        .pipe(gzip({append: false, gzipOptions: {level: 9}}))
        .pipe(rename(componentsFileGz))
        .pipe(gulp.dest(buildDir));
});

gulp.task('copy-fontawesome', function () {
    var fontawesomePath = buildDir + '/fontawesome/';
    mkdirp(fontawesomePath, function (err) {
        if (err) {
            console.error(err);
        }
    });
    return gulp.src('node_modules/components-font-awesome/**/*')
        .pipe(gulp.dest(fontawesomePath));
});

gulp.task('copy-bootstrap', function () {
    var bootstrapPath = buildDir + '/bootstrap/';
    mkdirp(bootstrapPath, function (err) {
        if (err) {
            console.error(err);
        }
    });
    return gulp.src('node_modules/bootstrap/**/*')
        .pipe(gulp.dest(bootstrapPath));
});


gulp.task('build-3rdparty-styles', ['copy-bootstrap', 'copy-fontawesome'], function () {
    return gulp.src(webappFiles.thirdParty.css)
        .pipe(concat(webapp3rdpartyCss))
        .pipe(gulp.dest(buildDir));
});

gulp.task('copy-files', function () {
    return gulp.src(webappFiles.thirdParty.copy)
        .pipe(gulp.dest(buildDir));
});

gulp.task('build-3rdparty', ['copy-files', 'build-3rdparty-styles'], function () {
    return gulp.src(webappFiles.thirdParty.js)
        .pipe(concat(webapp3rdparty))
        .pipe(gulp.dest(buildDir));
});

gulp.task('build-webapp-styles', function () {
    return gulp.src(webappFiles.cttv.css)
        .pipe(sass({
            errLogToConsole: true
        }))
        .pipe(csspurge())
        .pipe(sourcemaps.init())
        .pipe(concat(webappName + '.min.css'))
        .pipe(minifyCss({compatibility: 'ie9'}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(buildDir));
});


// ----------------------------------------
// Configuration JSON
// ----------------------------------------


/*
 * Gets and returns the list of directories at the specified location
 * @param {string} dir
 * @return {array} The list of directories (folders) as an array of strings
 */
function getFolders (dir) {
    return fs.readdirSync(dir)
        .filter(function (file) {
            return fs.statSync(join(dir, file)).isDirectory();
        });
}


/*
 * Parse a section (folder) in the config dir:
 * the function merges default.json and the optional custom.json into combined.json
 * Under json root there is one element with the same name as the directory.
 * @param {string} scriptsPath
 * @param {string} dir
 * @return {promise}
 */
function parseConfigDir (scriptsPath, dir) {
    return new Promise(function (resolve, reject) {
        gulp.src(configSourceFiles.map(function (i) { return join(scriptsPath, dir, i); }))
            .pipe(jsonminify()) // remove any comments which would break the merging
            .pipe(merge({
                fileName: configMergedSources,  // combined.json
                edit: function (parsedJson, file) {
                    var editedJson = {};
                    editedJson[dir] = parsedJson;
                    return editedJson;
                }
            }))
            .on('error', reject)
            .pipe(gulp.dest(join(scriptsPath, dir)))
            .on('end', resolve);
    });
}


/*
 * Replace the API host in the config files based on the APIHOST env variable
 * Note: this is structure sensitive. After merging, the api is under 'general'
 */
function updateAPI (parsedJson) {
    if (process.env.APIHOST) {
        parsedJson.general.api = process.env.APIHOST; // APIHOST to define an API to point to
    }
    return parsedJson;
}


/**
 * Loop through the directories in config/ and parse/merge default and custom jsons
 */
gulp.task('parse-custom-configs', function () {
    var folders = getFolders(configDir);
    return Promise.all(folders.map(
        function (dir) {
            return parseConfigDir(configDir, dir);
        })
    );
});


/**
 * Merge the combined.json files for each section into final config JSON
 */
gulp.task('build-config-merged', ['parse-custom-configs'], function () {
    return gulp.src(join(configDir, '*', configMergedSources))
        // merge all the JSONs
        .pipe(merge({
            fileName: configFile
        }))
        // set API if needed - yes, this has to be in a separate .pipe() after all files are merged into one
        .pipe(merge({
            fileName: configFile,
            edit: updateAPI
        }))
        .pipe(jsonminify())
        .pipe(gulp.dest(buildDir));
});


/**
 * New build-config main task
 * Calls dependencies and remove temporary files
 */
gulp.task('build-config', ['build-config-merged'], function () {
    del(join(configDir, '*', configMergedSources));
});


// PARSE IN MEMORY


/*
 * Merge and parse json files in the specified directory and return the processed json (promise)
 */
function parseConfigDirJson (scriptsPath, dir) {
    var editedJson;
    return new Promise(function (resolve, reject) {
        gulp.src(configSourceFiles.map(function (i) { return join(scriptsPath, dir, i); }))
            .pipe(jsonminify()) // remove any comments which would break the merging
            .pipe(merge({       // merge default and custom (if it exists) into combined.json
                fileName: configMergedSources
            }))
            .pipe(merge({       // add filename as key for the whole json
                fileName: configMergedSources,
                edit: function (parsedJson, file) {
                    editedJson = {};
                    editedJson[dir] = parsedJson;
                    return editedJson;
                }
            }))
            .on('error', reject)
            .on('end', function () {
                resolve(editedJson);
            });
    });
}


/**
 * Parse all config directories and build final config JSON file
 */
gulp.task('build-config-all', function () {
    // loop through all config directories and get all combined (default+custom) jsons
    var folders = getFolders(configDir);
    Promise.all(folders.map(
        function (dir) {
            return parseConfigDirJson(configDir, dir);
        })
    )
        .then(function (allcombined) {
            // merge the combined jsons: here we can't just use merge(),
            // so we have to build up the new object manually and populate it with the first key in each json
            var obj = {};
            allcombined.forEach(function (combined) {
                var k0 = Object.keys(combined)[0];
                obj[k0] = combined[k0];
            });
            // update the API URL if needed
            if (process.env.APIHOST) {
                obj.general.api = process.env.APIHOST; // APIHOST to define an API to point to
            }
            // add the version as per package.json file
            obj.general.version = packageFile.version;
            // manually write the file
            fs.stat(join(buildDir, configFile), function (err, stat) {
                fs.writeFileSync(join(buildDir, configFile), JSON.stringify(obj));
            });
        });
});


// ----------------------------------------


gulp.task('build-webapp-index', function () {
    return gulp.src('app/index-tmpl.html')
        .pipe(rename('index.html'))
        .pipe(replace('%VER%', packageFile.version))
        .pipe(gulp.dest('app/'));
});


gulp.task('build-webapp', ['build-webapp-styles', 'build-config-all', 'build-webapp-index'], function () {
    return gulp.src(webappFiles.cttv.js)
        .pipe(sourcemaps.init({
            debug: true
        }))
        .pipe(concat(webappFileMin))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(buildDir));
});

gulp.task('webserver', ['build-all'], function () {
    gulp.src('app')
        .pipe(server({
            livereload: true,
            fallback: 'index.html',
            host: 'localhost',
            port: '8000',
            defaultFile: 'index.html',
            proxies: [
                {source: '/api', target: 'http://local.targetvalidation.org:8899/api'},
                {source: '/proxy/www.ebi.ac.uk/', target: 'https://www.ebi.ac.uk/'},
                {source: '/proxy/reactome.org/', target: 'http://reactome.org/'},
                {source: '/proxy/wwwdev.ebi.ac.uk/', target: 'http://wwwdev.ebi.ac.uk/'},
                {source: '/proxy/rest.ensembl.org/', target: 'https://rest.ensembl.org/'},
                {source: '/proxy/reactomedev.oicr.on.ca/', target: 'http://reactomedev.oicr.on.ca/'},
                {source: '/proxy/blog.opentargets.org/rss/', target: 'https://blog.opentargets.org/rss/'}
            ],
            open: true
        }))
        .pipe(gulp.watch(gulp.watch([
            './app/js/**/*',
            './app/css/**/*'
        ], ['build-webapp'])));
});


gulp.task('build-all', ['init', 'build-3rdparty', 'build-components-min', 'build-webapp', 'build-lazy-loaded-components']);

// QA auth stuff 

gulp.task('copy-basic-auth', function () {
    return gulp.src('netlify_headers')
        .pipe(gulp.dest('_site/_headers'));
});
gulp.task('build-qa', ['build-all', 'copy-basic-auth']);

// Lazy Loaded modules
// Interactions Viewer
var basePathIV = 'node_modules/ot.interactions_viewer/';
var outputBaseFileIV = 'interactionsViewer';

gulp.task('build-interactionsViewer-styles', function () {
    return gulp.src(basePathIV + 'index.scss')
        .pipe(sass({
            errLogToConsole: true
        }))
        .pipe(rename(outputBaseFileIV + '.css'))
        .pipe(gulp.dest(buildDir));
});

gulp.task('copy-babel-polyfill', function () {
    return gulp.src('node_modules/babel-polyfill/dist/polyfill.min.js')
        .pipe(gulp.dest(buildDir));
});

gulp.task('build-interactionsViewer', ['copy-babel-polyfill', 'build-interactionsViewer-styles'], function () {
    return browserify({
        entries: basePathIV + 'browser.js',
        debug: true,
        standalone: outputBaseFileIV
    }).transform(babelify, {presets: ['es2015'], sourceMaps: true})
        .bundle()
        .pipe(source(outputBaseFileIV + '.min.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(buildDir))
        .pipe(gutil.noop());
});

gulp.task('build-lazy-loaded-components', ['build-interactionsViewer']);
