angular.module('otPlugins')
    .directive('genomeBrowser', ['otApi', 'otUtils', function (otApi, otUtils) {
        'use strict';

        // Decorate the svg for exporting
        function decorateSVG (from_svg, gB, targetName) {
            var clone = from_svg.cloneNode(true);

            // Get the biotypes (needed for the legend)
            var biotypes = gB.biotypes();
            var extraHeight = biotypes.length * 20;

            // Increase the current height of the svg taking into account the extra height:
            var currHeight = ~~d3.select(clone)
                .attr('height');

            d3.select(clone)
                .attr('height', currHeight + extraHeight);

            // Legend SVG
            var legend = d3.select(clone)
                .append('g')
                .attr('transform', 'translate(0,' + (currHeight + 10) + ')');

            var geneLegendEntries = legend.selectAll('.geneLegendEntry')
                .data(biotypes)
                .enter()
                .append('g')
                .attr('class', 'geneLegendEntry')
                .attr('transform', function (d, i) {
                    return 'translate(0,' + (i * 15) + ')';
                });

            geneLegendEntries
                .append('rect')
                .attr('x', 30)
                .attr('y', 0)
                .attr('width', 10)
                .attr('height', 10)
                .attr('fill', function (d) {
                    return d.color;
                });
            geneLegendEntries
                .append('text')
                .attr('x', 50)
                .attr('y', 10)
                .attr('fill', 'black')
                .style('font-size', '10px')
                .text(function (d) {
                    return d.label;
                });

            var snpLegend = legend
                .append('g')
                .attr('transform', 'translate(200,10)');
            snpLegend.append('circle')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', 5)
                .attr('fill', '#3e9999');
            snpLegend.append('text')
                .attr('x', 15)
                .attr('y', 5)
                .attr('fill', 'black')
                .style('font-size', '10px')
                .text('SNP in ' + targetName);
            snpLegend.append('circle')
                .attr('cx', 0)
                .attr('cy', 15)
                .attr('r', 5)
                .attr('fill', '#cccccc');
            snpLegend.append('text')
                .attr('x', 15)
                .attr('y', 15)
                .attr('fill', 'black')
                .style('font-size', '10px')
                .text('Other SNP');

            return clone;
        }

        return {
            restrict: 'E',
            templateUrl: 'plugins/genome-browser/genome-browser.html',
            scope: {
                target: '=',
                disease: '=',
                width: '='
            },

            link: function (scope, element) {
                var efo = scope.disease ? scope.disease.id : undefined;
                var w = scope.width - 40;
                var newDiv = document.createElement('div');
                newDiv.id = 'targetGenomeBrowser';
                // newDiv.className = "accordionCell";
                element[0].appendChild(newDiv);

                var gB = tnt.board.genome()
                    .species('human')
                    .gene(scope.target.id)
                    .context(20)
                    .width(w);

                gB.rest()
                    .prefix('/proxy/rest.ensembl.org')
                    .protocol('')
                    .domain('');
                var theme = targetGenomeBrowser()
                    .efo(efo)
                    .cttvRestApi(otApi.getSelf());
                theme(gB, newDiv);

                if (otUtils.browser.name !== 'IE') {
                    scope.toExport = function () {
                        var svg = decorateSVG(newDiv.querySelector('svg'), theme, scope.target.approved_symbol);
                        return svg;
                    };
                }
            }
        };
    }]);
