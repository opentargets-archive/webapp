

angular.module('cttvApp', [
    'ngRoute',
    'ui.bootstrap',
    'cttvControllers',
    'cttvDirectives',
    'cttvFilters',
    'angulartics',
    //'angulartics.google.analytics',
    'angulartics.piwik',
    'viewhead',
    'cttvServices',
    'hm.readmore',
    'ngSanitize',
    'swaggerUi'
])

.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {
        'use strict';

        $routeProvider.
            when('/', {
                templateUrl: 'partials/intro.html'
            }).
            when('/search', {
                templateUrl: 'partials/search.html',
                controller: 'SearchAppCtrl'
            }).
    	    when('/target/:id/associations', {
                templateUrl: 'partials/target-associations.html',
                controller: 'targetAssociationsCtrl',
                reloadOnSearch: false
    	    }).
    	    when('/disease/:id/associations', {
                templateUrl: 'partials/disease-associations.html',
                controller: 'diseaseAssociationsCtrl',
                reloadOnSearch: false
    	    }).
    	    when('/evidence/:id/:id', {
                templateUrl: 'partials/target-disease.html',
                controller: 'TargetDiseaseCtrl'
    	    }).
    	    when('/target/:id', {
        		templateUrl: 'partials/target.html',
        		controller: 'TargetCtrl'
    	    }).
    	    when('/disease/:id', {
        		templateUrl: 'partials/disease.html',
        		controller: 'DiseaseCtrl'
    	    }).

            // Docs
            when('/faq', {
                //templateUrl: 'docs/faq.html'
                templateUrl: 'partials/faq.html'
            }).
            when('/data_sources', {
                templateUrl: 'docs/data_sources.html'
            }).
            when('/terms_of_use', {
                //templateUrl: 'docs/terms_of_use.html',
                templateUrl: 'partials/terms_of_use.html',
            }).
            when('/release-notes', {
                templateUrl: 'partials/release-notes.html'
            }).
            when('/scoring', {
                //templateUrl: 'docs/scoring.html'
                templateUrl: 'partials/scoring.html'
            }).
            when('/about', {
                //templateUrl: 'docs/about.html'
                templateUrl: 'partials/about.html'
            }).
            when('/personal-data-collected-examples', {
                templateUrl: 'docs/personal-data-collected-examples.html'
            }).
            when('/variants', {
                templateUrl: 'docs/variants.html'
            }).
            when('/documentation/components', {
                templateUrl: 'partials/docs.html'
            }).
            when('/downloads/data', {
                templateUrl: 'partials/dumps.html'
            }).
            when('/documentation/api', {
                templateUrl: 'partials/api-docs.html'
            }).
            otherwise({
                redirectTo: '/'
            });

            // function supports_history_api() {
            //     return !!(window.history && history.pushState);
            // }


        $locationProvider.html5Mode(true).hashPrefix('!');

}]);
