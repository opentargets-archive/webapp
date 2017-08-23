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
//            'node_modules/d3-color/build/d3-color.min.js',
//            'node_modules/d3-interpolate/build/d3-interpolate.min.js',
//            'node_modules/d3-scale-chromatic/build/d3-scale-chromatic.min.js',
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
            // Load modules first
            'app/src/js/modules.js',
            // Processed (pages)
            'app/src/pages/disease-associations/disease-associations-controller.js',
            'app/src/pages/target-associations/target-associations-controller.js',
            'app/src/pages/evidence/target-disease-controller.js',
            'app/src/pages/target-profile/target-controller.js',
            'app/src/pages/disease-profile/disease-controller.js',
            'app/src/pages/search/search-controller.js',
            'app/src/pages/outreach/outreach-controller.js',
            'app/src/pages/batch-search/batch-search-controller.js',
            'app/src/pages/summary/summary-controller.js',
            'app/src/pages/data-sources/data-sources-controller.js',
            // Processed (services)
            'app/src/services/utils-service.js',
            'app/src/services/modal-service.js',
            'app/src/services/live-config-service.js',
            'app/src/services/api-service.js',
            'app/src/services/dictionary-service.js',
            'app/src/services/definitions-service.js',
            'app/src/services/omnipathdb-sources-service.js',
            'app/src/services/teps-service.js',
            'app/src/services/const-service.js',
            'app/src/services/config-service.js',
            'app/src/services/location-state-service.js',
            'app/src/services/filters-service.js',
            'app/src/services/loaded-lists-service.js',
            'app/src/services/lazyload.js',
            // Processed (filters)
            'app/src/filters/filters.js',
            // Our angular stuff
            'app/src/js/app.js',
            'app/src/js/controllers.js',
            'app/src/js/search-box-controller.js',
            'app/src/js/directives.js',
            'app/src/js/filter-by-file-targets-directive.js',
            'app/src/js/disease-associations-table-directive.js',
            'app/src/js/target-associations-table-directive.js',
            'app/src/js/target-associations-tree-directive.js',
            'app/src/js/target-associations-bubbles-directive.js',
            'app/src/js/evidence-tables-directives.js',
            'app/src/js/text-mining-table-directive.js',
            'app/src/js/calendar-directive.js',
            'app/src/js/disease-graph-directive.js',
            'app/src/js/batch-search-directives.js',
            'app/src/js/multiple-targets-associations-summary-directives.js',
            'app/src/js/multiple-targets-pathways-summary-directive.js',
            'app/src/js/multiple-targets-drugs-summary-directives.js',
            'app/src/js/multiple-targets-tissues-summary-directive.js',
            'app/src/js/multiple-targets-interactions-summary-directive.js',
            'app/src/js/pathway-summary-directive.js',
            'app/src/js/drug-summary-directive.js',
            'app/src/js/interactions-viewer-directive.js',
            'app/src/js/plugin-directive.js',
            'app/src/js/facets.js',
            // Plugins -- should go in another config file
            // 'app/plugins/pdb-directive.js',
            // 'app/plugins/proteinFeatures-directive.js',
            // 'app/plugins/protein-baseline-expression-directive.js',
            // 'app/plugins/test-directive.js',
            'app/plugins/*.js',
            'app/facets/*/*.js'
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
