angular.module('plugins')
    .directive('targetFamily', ['$log', function ($log) {
        'use strict';

        return {
            restrict: 'E',
            template: '<p class=cttv-section-intro>Phylogenetic tree showing the history of the human gene '
            + '{{target.symbol}} based on protein sequences. The tree shows human paralogs and orthologs in'
            + 'selected species. Click on any node to get more information about the homology relationship.'
            + 'Check / Uncheck species to prune the tree accordingly</p>',

            scope: {
                target: '=',
                width: '='
            },
            link: function (scope, element, attrs) {
                var width = scope.width - 40;
                var newDiv = document.createElement("div");
                newDiv.id = "cttvTargetGeneTree";
                element[0].appendChild(newDiv);

                var gt = targetGeneTree()
                    .id(scope.target.id)
                    .width(width)
                    .proxy("/proxy/rest.ensembl.org");
                gt(newDiv);
            }
        };
    }]);
