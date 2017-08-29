angular.module('otPlugins')
    .directive('proteinBaselineExpression', [function () {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/protein-baseline-expression.html',
            scope: {
                target: '='
            }
        };
    }]);
