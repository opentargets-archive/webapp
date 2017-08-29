angular.module('otPlugins')
    .directive('diseaseClassification', ['otApi', '$timeout', 'otUtils', function (otApi, $timeout, otUtils) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/disease-classification/disease-classification.html',
            scope: {
                disease: '=',
                width: '='
            },
            link: function (scope) {
                $timeout(function () {
                    var container = document.getElementById('ot-efo-graph');

                    var efoGraph = diseaseGraph()
                        .width(scope.width - 40) // 40 for margins
                        .height(700)
                        .data(scope.disease)
                        .cttvApi(otApi.getSelf());

                    efoGraph(container);

                    // The PNG export routine
                    if (otUtils.browser.name !== 'IE') {
                        scope.toExport = function () {
                            var svg = document.getElementById('ot-efo-graph').querySelector('svg');
                            return svg;
                        };
                    }
                }, 0);
            }
        };
    }]);
