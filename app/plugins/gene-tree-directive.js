angular.module('plugins')
    .directive('geneTree', ['$log', 'cttvUtils', '$timeout', function ($log, cttvUtils, $timeout) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/gene-tree.html',

            scope: {
                target: '=',
                width: '='
            },
            link: function (scope, element, attrs) {
                var width = scope.width - 40;
                // var newDiv = document.createElement("div");
                // element[0].appendChild(newDiv);

                var gt = targetGeneTree()
                    .id(scope.target.id)
                    .width(width)
                    .proxy("/proxy/rest.ensembl.org")
                    .on("notFound", function() {
                        scope.notFound = 1;
                    });

                $timeout(function() {
                    var el = document.getElementById('gene-tree');
                    gt(el);
                }, 0);

                if (cttvUtils.browser.name !== "IE") {
                    scope.toExport = function () {
                        var svg = newDiv.querySelector("svg");
                        return svg;
                    };
                }

            }
        };
    }]);
