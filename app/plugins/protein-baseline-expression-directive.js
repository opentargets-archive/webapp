angular.module('plugins')
    .directive('proteinBaselineExpression', ['$log', function ($log) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/protein-baseline-expression.html',
            scope: {
                target: '='
            }
        };
    }]);
