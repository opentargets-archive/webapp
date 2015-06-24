
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
                scope.$watch (function () {return attrs.efo;}, function (efo_str) {
                    //console.warn (efo);
                    if (!efo_str) {
                        return;
                    }
                    var efo = JSON.parse(efo_str);
                    //var nodes = getNodes(efo);
                    //var graph = getGraph(efo);
                    var efoGraph = diseaseGraph()
                        .width(w)
                        .height(700)
                        .data(efo);
                    efoGraph(elem[0]);
                });
            }
        };
    }
    ]);
