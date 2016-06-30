angular.module('plugins')
    .directive('rnaBaselineExpression', ['$log', '$timeout', function ($log, $timeout) {
        'use strict';

        return {
            restrict: 'E',
            template: '<div id="gxaWidget"></div>',
            scope: {
                target: "=",
            },
            link: function (scope, element, attrs) {

                $timeout(function () {
                    expressionAtlasHeatmapHighcharts.render({
                        params: 'geneQuery=' + scope.target.symbol + "&species=homo%20sapiens",
                        isMultiExperiment: true,
                        target: "gxaWidget",
                        disableGoogleAnalytics: true,
                        proxyPrefix: "/proxy",
                    });
                }, 0);
            }
        };
    }]);
