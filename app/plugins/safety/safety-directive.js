angular.module('otPlugins')
    .directive('otSafety', [function () {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: '/plugins/safety/safety.html',
            scope: {
                target: '='
            },
            link: function (scope, elem, attrs) {}
        };
    }]);
