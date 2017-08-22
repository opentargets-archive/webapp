angular.module('plugins')
    .directive('testPlugin', ['$log', function ($log) {
        'use strict';
        return {
            // Needed
            restrict: 'E',
            template: '<p>Hello world!</p>',
            scope: {
                target: '='
            },
            link: function (scope, element, attrs) {
                $log.log(myTest('Hello World'));
            }
        };
    }]);
