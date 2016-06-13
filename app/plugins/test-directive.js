angular.module('plugins')
    .directive('testPlugin', [function () {
        'use strict';
        return {
            // Needed
            restrict: 'E',
            template: "<p>Hello world!</p>",
            scope: {
                target: '='
            },
            link: function (scope, element, attrs) {
                console.log(myTest('Hello World'));
            }
        };
    }]);
