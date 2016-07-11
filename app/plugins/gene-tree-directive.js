angular.module('plugins')
    .directive('geneTree', ['$log', 'cttvUtils', function ($log, cttvUtils) {
        'use strict';

        return {
            restrict: 'E',
            template: '<p class=cttv-section-intro>Phylogenetic tree showing the history of the human gene '
            + '{{target.symbol}} based on protein sequences. The tree shows human paralogs and orthologs in'
            + 'selected species. Click on any node to get more information about the homology relationship.'
            + 'Check / Uncheck species to prune the tree accordingly</p><p ng-if=notFound==1>No gene tree has been found for {{target.symbol}}</p><png filename="{{target.approved_symbol}}-geneTree.png" track="geneTree"></png>',

            scope: {
                target: '=',
                width: '='
            },
            link: function (scope, element, attrs) {
                var width = scope.width - 40;
                var newDiv = document.createElement("div");
                element[0].appendChild(newDiv);

                var gt = targetGeneTree()
                    .id(scope.target.id)
                    .width(width)
                    .proxy("/proxy/rest.ensembl.org")
                    .on("notFound", function() {
                        scope.notFound = 1;
                    });
                gt(newDiv);


                if (cttvUtils.browser.name !== "IE") {
                    scope.toExport = function () {
                        var svg = newDiv.querySelector("svg");
                        return svg;
                    };
                }

            }
        };
    }]);
