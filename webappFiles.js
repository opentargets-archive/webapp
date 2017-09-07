var webappFiles = {
    // 3rd party libs
    thirdParty: {
        'js': [
            'bower_components/angular/angular.min.js',
            'bower_components/angular-route/angular-route.min.js',
            'bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
            'bower_components/angulartics/dist/angulartics.min.js',
            'bower_components/angulartics/dist/angulartics-piwik.min.js',
            'bower_components/d3/d3.min.js',
            // 'node_modules/d3-color/build/d3-color.min.js',
            // 'node_modules/d3-interpolate/build/d3-interpolate.min.js',
            // 'node_modules/d3-scale-chromatic/build/d3-scale-chromatic.min.js',
            'bower_components/jquery/dist/jquery.min.js',
            'app/vendor/cola/cola.min.js',
            'app/src/js/angularjs-viewhead.js',
            'bower_components/angular-animate/angular-animate.min.js',
            'bower_components/angular-cookies/angular-cookies.js',
            'bower_components/angular-local-storage/dist/angular-local-storage.min.js',
            'bower_components/angular-read-more/dist/readmore.min.js',
            'bower_components/lodash/dist/lodash.min.js',
            'bower_components/angular-sanitize/angular-sanitize.min.js',
            'app/vendor/angular-swagger-ui/swagger-ui.min.js',
            'app/vendor/angular-swagger-ui/swagger-yaml-parser.min.js',
            'node_modules/js-yaml/dist/js-yaml.min.js',
            'app/vendor/foamtree/carrotsearch.foamtree.js',
            'node_modules/marked/marked.min.js',
            'bower_components/FileSaver/FileSaver.min.js',
            'bower_components/moment/moment.js',
            'bower_components/abdmob/x2js/xml2json.min.js'
        ],
        'css': [
            'bower_components/bootstrap/dist/css/bootstrap.css',
            'app/vendor/angular-swagger-ui/swagger-ui.min.css'
        ],
        'cssCopyDir': [
            'bower_components/components-font-awesome/**/*'
        ],
        'copy': [
            'bower_components/bio-pv/bio-pv.min.js'
        ]
    },

    cttv: {
        'js': [
            // Main app (modules seems to need to be first)
            'app/src/init/modules.js',
            'app/src/pages/**/*.js',
            'app/src/services/*.js',
            'app/src/filters/*.js',
            'app/src/components/**/*.js',
            'app/src/js/*.js',
            'app/src/init/app.js',

            // Plugins
            'app/plugins/*/*.js',

            // Facets
            'app/facets/*/*.js'
        ],

        css: [
            'app/css/index.scss'
        ]
    }
};
module.exports = exports = webappFiles;
