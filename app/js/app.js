'use strict';



angular.module('cttvApp', [
	'ngRoute',
    'ui.bootstrap',
    'cttvControllers',
    'chartApp',
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
            when('/evidences', {
                templateUrl: 'partials/evidences.html',
                controller: 'EvidencesCtrl'
            }).
            /*when('/evidences/:id', {
                templateUrl: 'partials/evidence.html',
                controller: 'EvidencesCtrl'
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
