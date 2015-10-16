
angular.module('cttvDirectives')

    .directive('cttvEfoGraph', ['$log', 'cttvAPIservice', function ($log, cttvApiservice) {
        'use strict';
        return {
            restrict: 'E',

            scope: {
                efo : "&disease"
            },

            link: function (scope, elem, attrs) {
                //console.warn (efo);
                var w = (attrs.width || elem[0].parentNode.offsetWidth) - 40;
                var efoGraph = diseaseGraph()
                    .width(w)
                    .height(700)
                    .cttvApi(cttvApiservice.getSelf());

                scope.$watch (function () {return attrs.efo;}, function (efo_str) {
                    //console.warn (efo);
                    if (!efo_str) {
                        return;
                    }
                    var efo = JSON.parse(efo_str);
                    efoGraph.data(efo);
                    efoGraph(elem[0]);
                });
            }
        };
    }
    ]);
