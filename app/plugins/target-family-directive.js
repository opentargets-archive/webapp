angular.module('plugins')
    .directive('targetFamily', ['$log', 'cttvUtils', function ($log, cttvUtils) {
        'use strict';

        var rx = /species\/(.*)\.png/;

        function removeImgs(from_svg, geneTree) {
            var clone = from_svg.cloneNode(true);

            // Get all the leaves --
            var leaves = d3.select(clone).selectAll(".leaf");
            leaves
                .each(function (d, i) {
                    var g = d3.select(this); // the g for the node
                    var spRaw = g.select("image")
                        .attr("href");
                    var sp = (rx.exec(spRaw))[1];
                    console.log(sp);
                    var gene = g.select("text")
                        .text();
                    g
                        .select("text")
                        .attr("transform", "translate(10,5)")
                        .text(gene + " (" + geneTree.scientific2common(sp) + ")");
                });

            // Remove the images --
            leaves.selectAll("image").remove();
            console.log(clone);
            return clone;
        }

        return {
            restrict: 'E',
            template: '<p class=cttv-section-intro>Phylogenetic tree showing the history of the human gene '
            + '{{target.symbol}} based on protein sequences. The tree shows human paralogs and orthologs in'
            + 'selected species. Click on any node to get more information about the homology relationship.'
            + 'Check / Uncheck species to prune the tree accordingly</p><png filename="{{target.approved_symbol}}-geneTree.png"></png>',

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
                    .proxy("/proxy/rest.ensembl.org");
                    // .on("load", function () {
                    //     console.log("TREE LOADED!!!");
                    //     scope.toExport = decorateExport(newDiv.querySelector("svg"));
                    // });
                gt(newDiv);

                console.log(cttvUtils.browser);

                scope.toExport = function () {
                    var svg = newDiv.querySelector("svg");
                    if (cttvUtils.browser.name === "Safari") {
                        svg = removeImgs(svg, gt);
                    }
                    return svg;
                };

            }
        };
    }]);
