angular.module('plugins')
    .directive('diseaseClassification', ['$log', 'cttvAPIservice', '$timeout', function ($log, cttvAPIservice, $timeout) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/disease-classification.html',
            scope: {
                disease: '=',
                width: '='
            },
            link: function (scope, element, attrs) {
                $timeout(function () {
                    var container = document.getElementById("cttv-efo-graph");

                    var efoGraph = diseaseGraph()
                        .width(scope.width)
                        .height(700)
                        .data(scope.disease)
                        .cttvApi(cttvAPIservice.getSelf());

                    efoGraph(container);
                },0);
            }
        };
    }]);
