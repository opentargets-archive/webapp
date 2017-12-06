var webappFiles = {
    // 3rd party libs
    thirdParty: {
        'js': [
            'node_modules/lodash/lodash.min.js',
            'node_modules/angular/angular.min.js',
            'node_modules/angular-route/angular-route.min.js',
            'node_modules/angular-ui-bootstrap/dist/ui-bootstrap-tpls.js',
            'node_modules/angulartics/dist/angulartics.min.js',
            'node_modules/angulartics/dist/angulartics-piwik.min.js',
            'node_modules/d3/d3.min.js',
            // 'node_modules/d3-color/build/d3-color.min.js',
            // 'node_modules/d3-interpolate/build/d3-interpolate.min.js',
            // 'node_modules/d3-scale-chromatic/build/d3-scale-chromatic.min.js',
            'node_modules/jquery/dist/jquery.min.js',
            'app/vendor/cola/cola.min.js',
            'app/src/js/angularjs-viewhead.js',
            'node_modules/angular-animate/angular-animate.min.js',
            'node_modules/angular-cookies/angular-cookies.min.js',
            'node_modules/angular-local-storage/dist/angular-local-storage.min.js',
            'node_modules/angular-read-more/dist/readmore.min.js',
            'node_modules/angular-sanitize/angular-sanitize.min.js',
            'node_modules/js-yaml/dist/js-yaml.min.js',
            'app/vendor/foamtree/carrotsearch.foamtree.js',
            'node_modules/marked/marked.min.js',
            'node_modules/venn.js/build/venn.min.js',
            'node_modules/file-saver/FileSaver.min.js',
            'node_modules/moment/moment.js'
        ],
        'css': [
            'node_modules/bootstrap/dist/css/bootstrap.css',
            'app/vendor/angular-swagger-ui/swagger-ui.min.css'
        ],
        'cssCopyDir': [
            'node_modules/components-font-awesome/**/*'
        ],
        'copy': [
            'node_modules/bio-pv/bio-pv.min.js'
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
            'app/facets/*/*.js',
            'app/facets/*.js'
        ],

        css: [
            'app/css/index.scss'
        ]
    }
};
module.exports = exports = webappFiles;
