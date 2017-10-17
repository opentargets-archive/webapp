/* eslint-disable angular/file-name */
function initApp (deps) {
    var app = angular.module('otApp', deps);

    // app.config([localStorageServiceProvider, function (localStorageServiceProvider) {
    //   localStorageServiceProvider
    //     .setPrefix('openTargets');
    // }]);


    app.config(['$routeProvider', '$locationProvider',
        function ($routeProvider, $locationProvider) {
            'use strict';

            $routeProvider
                .when('/', {
                    templateUrl: 'src/pages/static/intro.html'
                })
                .when('/search', {
                    templateUrl: 'src/pages/search/search.html',
                    controller: 'SearchController'
                })
                .when('/target/:id/associations', {
                    templateUrl: 'src/pages/target-associations/target-associations.html',
                    controller: 'TargetAssociationsController',
                    reloadOnSearch: false
                })
                .when('/disease/:id/associations', {
                    templateUrl: 'src/pages/disease-associations/disease-associations.html',
                    controller: 'DiseaseAssociationsController',
                    reloadOnSearch: false
                })
                .when('/evidence/:id/:id', {
                    templateUrl: 'src/pages/evidence/target-disease.html',
                    controller: 'TargetDiseaseController'
                })
                .when('/target/:id', {
                    templateUrl: 'src/pages/target-profile/target.html',
                    controller: 'TargetController'
                })
                .when('/disease/:id', {
                    templateUrl: 'src/pages/disease-profile/disease.html',
                    controller: 'DiseaseController'
                })
                .when('/batch-search', {
                    templateUrl: 'src/pages/batch-search/batch-search.html',
                    controller: 'BatchSearchController'
                })
                .when('/summary', {
                    templateUrl: 'src/pages/summary/summary.html',
                    controller: 'SummaryController'
                })

                // Docs
                .when('/faq', {
                    templateUrl: 'src/pages/static/faq.html'
                })
                .when('/data-sources', {
                    controller: 'DataSourcesController',
                    templateUrl: 'src/pages/data-sources/data-sources.html'
                })
                .when('/terms-of-use', {
                    templateUrl: 'src/pages/static/terms-of-use.html'
                })
                // 31-08-2017 (Luca):
                // Since we changed the route URL, the following is for backward compatibility only
                // TODO:
                // a few months after release delete the following 2 blocks FROM HERE
                .when('/data_sources', {
                    redirectTo: '/data-sources'
                })
                .when('/terms_of_use', {
                    redirectTo: '/terms-of-use'
                })
                // TODO: delete TO HERE
                .when('/release-notes', {
                    templateUrl: 'src/pages/static/release-notes.html'
                })
                .when('/scoring', {
                    templateUrl: 'src/pages/static/scoring.html'
                })
                .when('/about', {
                    templateUrl: 'src/pages/static/about.html'
                })
                .when('/personal-data-collected-examples', {
                    templateUrl: 'src/pages/static/personal-data-collected-examples.html'
                })
                .when('/variants', {
                    templateUrl: 'src/pages/static/variants.html'
                })
                .when('/documentation/components', {
                    templateUrl: 'src/pages/static/docs.html'
                })
                .when('/downloads/data', {
                    templateUrl: 'src/pages/static/dumps.html'
                })
                .when('/documentation/api', {
                    templateUrl: 'src/pages/static/api-docs.html'
                })
                .when('/outreach', {
                    templateUrl: 'src/pages/outreach/outreach.html',
                    controller: 'OutreachController'
                })
                .otherwise({
                    redirectTo: '/'
                });

            // function supports_history_api() {
            //     return !!(window.history && history.pushState);
            // }

            $locationProvider.html5Mode(true).hashPrefix('!');
        }]);

    return app;
}


var deps = [
    'ngRoute',
    'ngCookies',
    'LocalStorageModule',
    'ui.bootstrap',
    'otFilters',
    'otControllers',
    'otDirectives',
    'angulartics',
    'angulartics.piwik',
    'viewhead',
    'otServices',
    'hm.readmore',
    'ngSanitize',
    'swaggerUi',
    'otPlugins',
    'otFacets'
];

/*
 * Manual Angular bootstrapping:
 * load the config file first, then bootstrap the app
 */

angular.element(document).ready(
    function () {
        var initInjector = angular.injector(['ng']);
        var $http = initInjector.get('$http');
        var $q = initInjector.get('$q');
        // First get the config file
        $http.get('build/config.json').then(
            function (response) {
                deps = _.concat(deps, getComponents(response.data.general));
                configSystemjs(response.data.general, $q).then(function () {
                    var app = initApp(deps);
                    app.constant('initConfig', response.data);
                    angular.bootstrap(document, ['otApp']);
                });
            }
        );
    }
);

function getComponents (config) {
    var modules = [];
    var targetSections = config.targetSections;
    for (var i = 0; i < targetSections.length; i++) {
        section = targetSections[i];
        if (section.modules) {
            modules = _.concat(modules, section.modules);
        }
    }
    return modules;
}

// Configures systemjs and returns the external dependencies that need to be loaded before bootstrapping (promises).
function configSystemjs (config, $q) {
    var preloads = {};
    var targetSections = config.targetSections;
    var meta = {};
    for (var i = 0; i < targetSections.length; i++) {
        if (targetSections[i].dependencies) {
            meta = _.extend(meta, targetSections[i].dependencies);
        }
        if (targetSections[i].predependencies) {
            meta = _.extend(meta, targetSections[i].predependencies);
            preloads = _.extend(preloads, targetSections[i].predependencies);
        }
    }

    // Configure Systemjs
    System.config({
        'baseURL': './',
        'defaultJSExtensions': false,
        'transpiler': false,
        'paths': {
            'github:*': 'jspm_packages/github/*'
        },

        'map': {
            'css': 'github:/systemjs/plugin-css@0.1.21/css.js'
        },
        'meta': meta
    });

    var depsToLoad = Object.keys(preloads);
    var deps = [];
    for (var j = 0; j < depsToLoad.length; j++) {
        deps.push(System.import(depsToLoad[j]));
    }
    return $q.all(deps);
}
