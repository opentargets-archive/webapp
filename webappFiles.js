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
            'bower_components/jquery/dist/jquery.min.js',
            'app/vendor/cola/cola.min.js',
            'app/js/angularjs-viewhead.js',
            'bower_components/angular-animate/angular-animate.min.js',
            'bower_components/angular-cookies/angular-cookies.js',
            'bower_components/angular-read-more/dist/readmore.min.js',
            'bower_components/lodash/dist/lodash.min.js',
            'bower_components/angular-sanitize/angular-sanitize.min.js',
            'app/vendor/angular-swagger-ui/swagger-ui.min.js',
            'app/vendor/angular-swagger-ui/swagger-yaml-parser.min.js',
            'node_modules/js-yaml/dist/js-yaml.min.js',
            'node_modules/marked/marked.min.js',
            'bower_components/FileSaver/FileSaver.min.js',
            'bower_components/moment/moment.js'
        ],

        'css': [
            'bower_components/bootstrap/dist/css/bootstrap.css',
            'app/vendor/angular-swagger-ui/swagger-ui.min.css'
            // 'app/vendor/datatables/buttons.dataTables.min.css'
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
            // Our angular stuff
            'app/js/app.js',
            'app/js/controllers.js',
            'app/js/services.js',
            'app/js/api-service.js',
            'app/js/dictionary-service.js',
            'app/js/const-service.js',
            'app/js/config-service.js',
            'app/js/location-state-service.js',
            'app/js/filters-service.js',
            'app/js/filters.js',
            'app/js/search-controller.js',
            'app/js/search-box-controller.js',
            'app/js/outreach-controller.js',
            'app/js/target-associations-controller.js',
            'app/js/disease-associations-controller.js',
            'app/js/target-disease-controller.js',
            'app/js/target-controller.js',
            'app/js/disease-controller.js',
            'app/js/directives.js',
            'app/js/filter-by-file-targets-directive.js',
            'app/js/disease-associations-table-directive.js',
            'app/js/target-associations-table-directive.js',
            'app/js/target-associations-tree-directive.js',
            'app/js/target-associations-bubbles-directive.js',
            'app/js/evidence-tables-directives.js',
            'app/js/calendar-directive.js',
            'app/js/disease-graph-directive.js',
            'app/js/lazyload.js',
            'app/js/plugin-directive.js',
            // Plugins -- should go in another config file
            // 'app/plugins/pdb-directive.js',
            // 'app/plugins/proteinFeatures-directive.js',
            // 'app/plugins/protein-baseline-expression-directive.js',
            // 'app/plugins/test-directive.js',
            'app/plugins/*.js'
        ],

        css: [
            // 'app/bower_components/bootstrap/dist/css/bootstrap.css',
            // 'app/bower_components/components-font-awesome/css/font-awesome.css',
            // 'app/css/app.css',
            'app/css/index.scss',
            // 'app/vendor/datatables/buttons.dataTables.min.css'
        ]
    },

};
module.exports = exports = webappFiles;
