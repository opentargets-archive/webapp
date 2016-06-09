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
                    console.log("Starting expression atlas...");
                    console.log(window.exposed);
                    var atlasHeatmapBuilder = window.exposed;
                    console.log("STARTING THE EXPRESSION WIDGET...");
                    atlasHeatmapBuilder({
                        proxyPrefix: "/proxy",
                        //gxaBaseUrl: '/proxy/www.ebi.ac.uk/gxa/',
                        params: 'geneQuery=' + scope.target.symbol + "&species=homo%20sapiens",
                        isMultiExperiment: true,
                        target: "gxaWidget",
                        disableGoogleAnalytics: true
                    });
                }, 0);
            }
        };
    }]);
