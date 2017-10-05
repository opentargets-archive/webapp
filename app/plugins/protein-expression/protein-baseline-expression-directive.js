angular.module('otPlugins')
    .directive('otProteinBaselineExpression', [function () {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/protein-expression/protein-baseline-expression.html',
            scope: {
                target: '='
            }
        };
    }]);
