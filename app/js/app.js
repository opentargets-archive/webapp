'use strict';



angular.module('cttvApp', [
    'ngRoute',
    'ui.bootstrap',
    'cttvControllers',
    'cttvDirectives',
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
            when('/target-associations', {
                templateUrl: 'partials/target-associations.html',
                controller: 'AssociationsCtrl'
            }).
            when('/disease-associations', {
                templateUrl: 'partials/disease-associations.html',
                controller: 'AssociationsCtrl'
            }).
    	    when('/gene-disease', {
                redirectTo: '/target-disease'   // for backward compatibility
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
            when('/target-disease', {
                templateUrl: 'partials/target-disease.html',
                controller: 'TargetDiseaseCtrl'
            }).
            otherwise({
                redirectTo: '/intro'
            });

}]);

