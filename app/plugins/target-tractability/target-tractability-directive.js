angular.module('otPlugins')
    .directive('otTargetTractability', ['otConsts', function (otConsts) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/target-tractability/target-tractability.html',
            scope: {
                target: '='
            },
            link: function (scope, element, attrs) {
                otConsts;
                scope;
                element;
                attrs;
            }
        };
    }]);
