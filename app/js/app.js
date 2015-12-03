

angular.module('cttvApp', [
    'ngRoute',
    'ui.bootstrap',
    'cttvControllers',
    'cttvDirectives',
    'cttvFilters',
    // 'angulartics',
    //'angulartics.google.analytics',
    // 'angulartics.piwik',
    'viewhead',
    'cttvServices',
    'hm.readmore'
])

.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {
        'use strict';

        $routeProvider.
            when('/', {
                templateUrl: 'partials/intro.html'
            }).
            when('/about', {
                templateUrl: 'partials/about.html'
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
    	    // when('/gene-disease', {
            //     redirectTo: '/target-disease'   // for backward compatibility
    	    // }).
    	    when('/target/:id', {
        		templateUrl: 'partials/target.html',
        		controller: 'TargetCtrl'
    	    }).
    	    when('/disease/:id', {
        		templateUrl: 'partials/disease.html',
        		controller: 'DiseaseCtrl'
    	    }).
            when('/faq', {
                templateUrl: 'partials/faq.html'
            }).
            when('/data_sources', {
                templateUrl: 'docs/data_sources.html'
            }).
            /*when('/evidence/:id', {
                templateUrl: 'partials/evidence.html',
                controller: 'EvidenceCtrl'
            }).*/
            // when('/target-disease', {
            //     templateUrl: 'partials/target-disease.html',
            //     controller: 'TargetDiseaseCtrl'
            // }).
            when('/release-notes', {
                templateUrl: 'partials/release-notes.html'
            }).
            otherwise({
                redirectTo: '/'
            });

            // function supports_history_api() {
            //     return !!(window.history && history.pushState);
            // }


        $locationProvider.html5Mode(true).hashPrefix('!');

}]);
