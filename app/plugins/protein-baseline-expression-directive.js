angular.module('plugins')
    .directive('proteinBaselineExpression', ['$log', function ($log) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/protein-baseline-expression.html',
            scope: {
                target: '='
            },
            link: function (scope, element, attrs) {
                console.log("PROTEIN BASELINE EXPRESSION DIRECTIVE...");
                console.log(scope.target);
            }
        };
    }]);
