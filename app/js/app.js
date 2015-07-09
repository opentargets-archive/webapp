'use strict';



angular.module('cttvApp', [
    'ngRoute',
    'ui.bootstrap',
    'cttvControllers',
    'cttvDirectives',
    'cttvFilters',
    'angulartics',
    'angulartics.google.analytics',
    'viewhead',
    'cttvServices'
])

.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {
        $routeProvider.
            when('/intro', {
                templateUrl: 'partials/intro.html'
            }).
            when('/search', {
                templateUrl: 'partials/search.html',
                controller: 'SearchAppCtrl'
            }).
    	    when('/target/:id/associations', {
                templateUrl: 'partials/target-associations.html',
                controller: 'targetAssociationsCtrl'
    	    }).
    	    when('/disease/:id/associations', {
                templateUrl: 'partials/disease-associations.html',
                controller: 'diseaseAssociationsCtrl'
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
            /*when('/evidence/:id', {
                templateUrl: 'partials/evidence.html',
                controller: 'EvidenceCtrl'
            }).*/
            when('/target-disease', {
                templateUrl: 'partials/target-disease.html',
                controller: 'TargetDiseaseCtrl'
            }).
            when('/release-notes', {
                templateUrl: 'partials/release-notes.html'
            }).
            otherwise({
                redirectTo: '/intro'
            });

            // function supports_history_api() {
            //     return !!(window.history && history.pushState);
            // }


        $locationProvider.html5Mode(true).hashPrefix('!');

}]);
