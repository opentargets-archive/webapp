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
var extend = require('gulp-extend');
var merge = require('gulp-merge-json');

var through = require('through2');

var buildDir = 'app/build';
var componentsConfig = 'components.js';
var packageConfig = require('./package.json');

var componentsName = 'components-' + packageConfig.name;
var webappName = packageConfig.name;

// app config / initialization
var map = require('map-stream');
var webappConfigDir = 'app/config';
var webappConfigSources = [webappConfigDir + '/default.json', webappConfigDir + '/custom.json'];
var webappConfigSourceFiles = ['default.json', 'custom.json'];
var webappConfigFile = 'config.json';

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

// a failing test breaks the whole build chain
gulp.task('default', ['lint', 'test']);

gulp.task('lint', function () {
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
    return gulp.src('bower_components/components-font-awesome/**/*')
        .pipe(gulp.dest(fontawesomePath));
});

gulp.task('copy-bootstrap', function () {
    var bootstrapPath = buildDir + '/bootstrap/';
    mkdirp(bootstrapPath, function (err) {
        if (err) {
            console.error(err);
        }
    });
    return gulp.src('bower_components/bootstrap/**/*')
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


/**
 * Check if custom config json exists and if not creates file with standard content
 */
gulp.task('init-config', function () {
    fs.stat(webappConfigSources[1], function (err, stat) {
        if (!stat) {
            var content = '{}';
            fs.writeFileSync(webappConfigSources[1], content);
        }
    });
});


// replace the API host in the config files based on the APIHOST env variable
function setApi () {
    function substituteApi (file, enc, cb) {
        var apiHost = process.env.APIHOST; // APIHOST to define an API to point to
        if (apiHost) {
            var search = /"api":\s?".*"\s?,/;
            var replacement = '"api": "' + apiHost + '",';

            file.contents = new Buffer(String(file.contents).replace(search, replacement));
        }
        return cb(null, file);
    }

    return through.obj(substituteApi);
}

/**
 * Merges default and custom config json files.
 * Custom overrides default values
 */
gulp.task('build-config', ['init-config'], function () {
    return gulp.src(webappConfigSources)
        .pipe(setApi())
        .pipe(jsonminify())                     // remove comments
        .pipe(extend(webappConfigFile, false))  // merge files; no deep-checking, just first level, so careful to overwrite objects
        .pipe(gulp.dest(buildDir));
});


function getFolders (dir) {
    return fs.readdirSync(dir)
        .filter(function (file) {
            return fs.statSync(path.join(dir, file)).isDirectory();
        });
}


function parseConfigItem (dir) {

}


// gulp.task('task', function () {
//     return Promise.all([
//       new Promise(function(resolve, reject) {
//         gulp.src(src + '/*.md')
//           .pipe(plugin())
//           .on('error', reject)
//           .pipe(gulp.dest(dist))
//           .on('end', resolve)
//       }),
//       new Promise(function(resolve, reject) {
//         gulp.src(src + '/*.md')
//           .pipe(plugin())
//           .on('error', reject)
//           .pipe(gulp.dest(dist))
//           .on('end', resolve)
//       })
//     ]).then(function () {
//       // Other actions
//     });
//   });


gulp.task('parse-custom-configs', function (){
    var scriptsPath = 'app/config/';
    var folders = getFolders(scriptsPath);
    // var content = '';
    return Promise.all( folders.map(
        function (dir) {
            return new Promise(function (resolve, reject){       
                gulp.src(webappConfigSourceFiles.map(function (i) { return join(scriptsPath, dir, i); }))
                    .pipe(setApi())
                    .pipe(jsonminify()) // removes comments
                    // .pipe(extend('bobo.json', false))
                    .pipe(merge({
                        fileName: 'combined.json'
                    }))
                    .on('error', reject)
                    // .pipe(map(function(file, done) {
                    //     str += ': '+ file.contents.toString();
                    //     //str = folder+': '+str;
                    //     console.log(str);
                    //     //file.contents = new Buffer(str);
                    //     done(null, file);
                    // }));
                    .pipe(gulp.dest(join(scriptsPath, dir)))
                    .on('end', resolve);
            });
        })
    );
});


/**
 * New config includes dictionary
 */
gulp.task('build-config-new', function () {
    var scriptsPath = 'app/config/';
    var folders = getFolders(scriptsPath);
    var content = '';
    var tasks = folders.map(function (folder) {
        var str=folder;
        gulp.src(webappConfigSourceFiles.map(function (i) { return join(scriptsPath, folder, i); }))
            .pipe(setApi())
            .pipe(jsonminify())
            .pipe(extend('bobo.json', false))
            .pipe(map(function(file, done) {
                str += ': '+ file.contents.toString();
                //str = folder+': '+str;
                console.log(str);
                //file.contents = new Buffer(str);
                done(null, file);
            }));
            //.pipe(gulp.dest(join(scriptsPath, folder)));
        return str;
    });
    console.log('tasks: ',tasks);
    // content = folders.map(function (folder){
    //     var s = '"' + folder + '": ' + fs.readFileSync(join(scriptsPath, folder, 'bobo.json'), 'utf8');
    //     del(join(scriptsPath, folder, 'bobo.json'));  // doesn't work!
    //     return s;
    // }).join(',\n');

    // content = '{\n' + content + '\n}';

    // fs.writeFileSync(join(buildDir, webappConfigFile), content);
});

function bob () {
    return through.obj(console.log);
}

gulp.task('build-config-1', ['parse-custom-configs'], function () {
    var scriptsPath = 'app/config/';
    gulp.src( 'app/config/*/combined.json' )
        .pipe(concat(webappConfigFile))
        .pipe(jsonminify())
        .pipe(gulp.dest(buildDir))
        .on('end', del(join(scriptsPath, '*', 'combined.json')));
    // console.log('done');
});


// ----------------------------------------


gulp.task('build-webapp', ['build-webapp-styles', 'build-config'], function () {
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
                {source: '/proxy/www.reactome.org/', target: 'http://www.reactome.org/'},
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
