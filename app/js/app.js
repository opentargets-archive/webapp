

var app = angular.module('cttvApp', [
    'ngRoute',
    'ui.router',
    'ui.bootstrap',
    'cttvControllers',
    'cttvDirectives',
    'cttvFilters',
    'angulartics',
    'angulartics.piwik',
    'viewhead',
    'cttvServices',
    'hm.readmore',
    'ngSanitize',
    'swaggerUi'
]);



/*
 * App configuration uses the new UI-Router module
 */
app.config([ '$stateProvider', '$urlRouterProvider', '$locationProvider',
    function($stateProvider, $urlRouterProvider, $locationProvider) {

        // For any unmatched url, redirect to /state1
        $urlRouterProvider.otherwise("/");

        // Now set up the states:
        // syntax is similar to old angular router
        $stateProvider

            .state('intro', {
                url: "/",
                templateUrl: "partials/intro.html"
            })

            .state('search', {
                url:'/search',
                templateUrl: 'partials/search.html',
                controller: 'SearchAppCtrl',
            })

            .state('target-associations', {
                url: '/target/:id/associations',
                templateUrl: 'partials/target-associations.html',
                controller: 'targetAssociationsCtrl',
                reloadOnSearch: false
            })
            .state('disease-associations', {
                url: '/disease/:id/associations',
                templateUrl: 'partials/disease-associations.html',
                controller: 'diseaseAssociationsCtrl',
                reloadOnSearch: false
            })
            .state('evidence', {
                url: '/evidence/:tid/:did',
                templateUrl: 'partials/target-disease.html',
                controller: 'TargetDiseaseCtrl'
            })
            .state('target', {
                url: '/target/:id',
                templateUrl: 'partials/target.html',
                controller: 'TargetCtrl'
            })
            .state('disease', {
                url: '/disease/:id',
                templateUrl: 'partials/disease.html',
                controller: 'DiseaseCtrl'
            })

            // Docs
            .state('faq', {
                //templateUrl: 'docs/faq.html'
                url: '/faq',
                templateUrl: 'partials/faq.html'
            })
            .state('data-sources', {
                //templateUrl: 'docs/data_sources.html'
                url: '/data_sources',
                templateUrl: 'partials/data_sources.html'
            })
            .state('terms', {
                //templateUrl: 'docs/terms_of_use.html',
                url: '/terms_of_use',
                templateUrl: 'partials/terms_of_use.html',
            })
            .state('release-notes', {
                url: '/release-notes',
                templateUrl: 'partials/release-notes.html'
            })
            .state('scoring', {
                //templateUrl: 'docs/scoring.html'
                url: '/scoring',
                templateUrl: 'partials/scoring.html'
            })
            .state('about', {
                //templateUrl: 'docs/about.html'
                url: '/about',
                templateUrl: 'partials/about.html'
            })
            .state('personal-data', {
                //templateUrl: 'docs/personal-data-collected-examples.html'
                url: '/personal-data-collected-examples',
                templateUrl: 'partials/personal-data-collected-examples.html'
            })
            .state('variants', {
                //templateUrl: 'docs/variants.html'
                url: '/variants',
                templateUrl: 'partials/variants.html'
            })
            .state('docs-components', {
                url: '/documentation/components',
                templateUrl: 'partials/docs.html'
            })
            .state('downloads-data', {
                url: '/downloads/data',
                templateUrl: 'partials/dumps.html'
            })
            .state('docs-api', {
                url: '/documentation/api',
                templateUrl: 'partials/api-docs.html'
            })


        // Still needs default angular locationProvider service
        // to have html5 URL-style (i.e. sans #)
        $locationProvider.html5Mode(true).hashPrefix('!');


}]);



/*
 * Manual Angular bootstrapping:
 * load the config file first, then bootstrap the app
 */
angular.element(document).ready(
  function() {
    var initInjector = angular.injector(['ng']);
    var $http = initInjector.get('$http');
    $http.get('build/config.json').then(
      function(response) {
        app.constant('initConfig', response.data);
        angular.bootstrap(document, ['cttvApp']);
      }
    );
  }
);



