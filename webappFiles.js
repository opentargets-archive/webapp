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
            'app/src/services/app-to-api-service.js',
            'app/src/services/dictionary-service.js',
            'app/src/services/definitions-service.js',
            'app/src/services/omnipathdb-sources-service.js',
            'app/src/services/omnipathdb-categories-service.js',
            'app/src/services/teps-service.js',
            'app/src/services/consts-service.js',
            'app/src/services/config-service.js',
            'app/src/services/location-state-service.js',
            'app/src/services/filters-service.js',
            'app/src/services/loaded-lists-service.js',
            'app/src/services/lazy-service.js',
            // Processed (filters)
            'app/src/filters/clear-underscores-filter.js',
            'app/src/filters/ellipse-text-filter.js',
            'app/src/filters/metric-prefix-filter.js',
            'app/src/filters/month-to-string-filter.js',
            'app/src/filters/split-filter.js',
            'app/src/filters/strip-tags-filter.js',
            'app/src/filters/upper-case-first-filter.js',
            // Processed (directives)
            'app/src/components/plugin-loader/plugin-loader-directive.js',
            'app/src/components/pathway-summary/pathway-summary-directive.js',
            'app/src/components/target-associations/target-associations-table-directive.js',
            'app/src/components/target-associations/target-associations-tree-directive.js',
            'app/src/components/target-associations/target-associations-bubbles-directive.js',
            'app/src/components/disease-associations/disease-associations-table-directive.js',
            'app/src/components/filter-by-file-targets/filter-by-file-targets-directive.js',
            'app/src/components/efo-graph/efo-graph-directive.js',
            'app/src/components/drug-summary/drug-summary-directive.js',
            'app/src/components/known-drug-table/known-drug-table-directive.js',
            'app/src/components/batch-search/target-list-mapping-directive.js',
            'app/src/components/batch-search/target-list-upload-directive.js',
            'app/src/components/text-mining-table/text-mining-table-directive.js',
            'app/src/components/multiple-targets/multiple-targets-associations-summary-directives.js',
            'app/src/components/multiple-targets/multiple-targets-pathways-summary-directive.js',
            'app/src/components/multiple-targets/multiple-targets-drugs-summary-directives.js',
            'app/src/components/multiple-targets/multiple-targets-tissues-summary-directive.js',
            'app/src/components/multiple-targets/multiple-targets-interactions-summary-directive.js',
            'app/src/components/multiple-targets/interactions-viewer-directive.js',
            'app/src/components/facets/facets.js',
            'app/src/components/search-suggestions/search-suggestions-directive.js',
            'app/src/components/popover/popover-directive.js',
            'app/src/components/footer/footer-directive.js',
            'app/src/components/search-box/search-box-directive.js',
            'app/src/components/search-box/search-box-controller.js',
            'app/src/components/target-genome-browser/target-genome-browser-directive.js',
            'app/src/components/gene-disease-association/gene-disease-association-directive.js',
            'app/src/components/spinners/progress-spinner-directive.js',
            'app/src/components/spinners/page-progress-spinner-directive.js',
            'app/src/components/feeds/blog-feed-directive.js',
            'app/src/components/feeds/facebook-feed-directive.js',
            'app/src/components/feeds/twitter-feed-directive.js',
            'app/src/components/masthead/masthead-navigation-menu-directive.js',
            'app/src/components/masthead/masthead-notifications-menu-directive.js',
            'app/src/components/sticky-scroller/sticky-scroller-directive.js',
            'app/src/components/modal/modal-directive.js',
            'app/src/components/slider/slider-directive.js',
            'app/src/components/matrix/matrix-table-directive.js',
            'app/src/components/matrix/matrix-legend-directive.js',
            'app/src/components/md-parser/md-parser-directive.js',
            'app/src/components/more-less-text/more-less-text-directive.js',
            'app/src/components/help-icon/help-icon-directive.js',
            'app/src/components/beta-ribbon/beta-ribbon-directive.js',
            'app/src/components/size-listener/size-listener-directive.js',
            'app/src/components/resize/resize-directive.js',
            'app/src/components/png/png-directive.js',
            'app/src/components/log-session/log-session-directive.js',
            'app/src/components/hpa-tissue-expression/hpa-tissue-expression-directive.js',
            // Processed (controllers)
            'app/src/js/feedback-controller.js',
            'app/src/js/masthead-controller.js',
            'app/src/js/notify-controller.js',
            'app/src/js/page-controller.js',
            'app/src/js/stats-controller.js',
            // Our angular stuff
            'app/src/js/app.js',
            'app/src/js/controllers.js',
            'app/src/js/calendar-directive.js',
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
            'app/css/index.scss'
            // 'app/vendor/datatables/buttons.dataTables.min.css'
        ]
    }
};
module.exports = exports = webappFiles;
