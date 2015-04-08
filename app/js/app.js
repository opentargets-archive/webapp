'use strict';



angular.module('cttvApp', [
    'ngRoute',
    'ui.bootstrap',
    'cttvControllers',
    'cttvDirectives',
    'cttvFilters',
    'angulartics',
    'angulartics.google.analytics',
    'viewhead'
]).


config(['$routeProvider', 
    function($routeProvider) {
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
		templateUrl: 'partials/targetDisease.html',
		controller: 'targetDiseaseCtrl'
	    }).
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
            otherwise({
                redirectTo: '/intro'
            });

}]);

