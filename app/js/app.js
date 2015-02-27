'use strict';



angular.module('cttvApp', [
    'ngRoute',
    'ui.bootstrap',
    'cttvControllers',
    'cttvDirectives',
    'angulartics',
    'angulartics.google.analytics'
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
            when('/target-associations', {
                templateUrl: 'partials/target-associations.html',
                controller: 'AssociationsCtrl'
            }).
            when('/disease-associations', {
                templateUrl: 'partials/disease-associations.html',
                controller: 'AssociationsCtrl'
            }).
    	    when('/gene-disease', {
                templateUrl: 'partials/geneDisease.html',
                controller: 'GeneDiseaseCtrl'
    	    }).
	    when('/target/:id', {
		templateUrl: 'partials/target.html',
		controller: 'TargetCtrl'
	    }).
            /*when('/evidence/:id', {
                templateUrl: 'partials/evidence.html',
                controller: 'EvidenceCtrl'
            }).*/
            when('/d3test', {
                templateUrl: 'partials/d3test.html',
                controller: 'D3TestCtrl'
            }).
            otherwise({
                redirectTo: '/intro'
            });

}]);

