'use strict';



angular.module('cttvApp', [
	'ngRoute',
    'ui.bootstrap',
    'cttvControllers',
    'bubbleGraphApp'
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
            when('/evidence', {
                templateUrl: 'partials/evidence.html',
                controller: 'EvidenceCtrl'
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

        
        //$locationProvider.html5Mode(true);
        //$locationProvider.html5Mode(true).hashPrefix('!');
}]);
