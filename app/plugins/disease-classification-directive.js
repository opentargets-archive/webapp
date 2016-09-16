angular.module('plugins')
    .directive('diseaseClassification', ['$log', 'cttvAPIservice', '$timeout', 'cttvUtils', function ($log, cttvAPIservice, $timeout, cttvUtils) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/disease-classification.html',
            scope: {
                disease: '=',
                width: '='
            },
            link: function (scope, element, attrs) {
                console.log(scope.disease);
                $timeout(function () {
                    var container = document.getElementById("cttv-efo-graph");

                    var efoGraph = diseaseGraph()
                        .width(scope.width - 40) // 40 for margins
                        .height(700)
                        .data(scope.disease)
                        .cttvApi(cttvAPIservice.getSelf());

                    efoGraph(container);

                    // The PNG export routine
                    if (cttvUtils.browser.name !== "IE") {
                        scope.toExport = function () {
                            var svg = document.getElementById("cttv-efo-graph").querySelector("svg");
                            return svg;
                        };
                    }
                },0);

            }
        };
    }]);
