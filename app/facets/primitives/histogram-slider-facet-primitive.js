angular.module('otFacets')
    .directive('otHistogramSliderFacetPrimitive', [function () {
        /**
   * Render the histogram
   * @param {*} histogramData 
   * @param {*} svg 
   * @param {*} width 
   * @param {*} height 
   */
        var render = function (scope, state, svg, width, height) {
            var margins = {top: 10, right: 10, bottom: 25, left: 10};
            var histogramWidth = width - margins.left - margins.right;
            var histogramHeight = height - margins.top - margins.bottom;

            // width/height
            svg.attr('width', width)
                .attr('height', height);

            // scales
            var x = d3.scale.ordinal()
                .domain(_.range(1, 11))
                .rangeBands([0, histogramWidth], 0.2);
            var y = d3.scale.linear()
                .domain([0, d3.max(state.histogramData, function (d) { return d.value; })])
                .range([histogramHeight, 0]);

            // container group
            var g = svg.select('g.histogram-container');
            if (g.empty()) {
                g = svg.append('g')
                    .classed('histogram-container', true);
            }
            g.attr('transform', 'translate(' + margins.left + ',' + margins.top + ')');

            // x-axis
            var xAxis = d3.svg.axis()
                .scale(x)
                .orient('bottom')
                .tickSize(0)
                .tickPadding(8);
            var gAxis = svg.select('g.x-axis');
            if (gAxis.empty()) {
                gAxis = svg.append('g')
                    .classed('x-axis', true);
            }
            gAxis.attr('transform', 'translate(' + margins.left + ',' + (margins.top + histogramHeight) + ')')
                .call(xAxis);

            // helper function
            var selectBasedOn = function (g, minValue) {
                if (minValue === 0) {
                    g.selectAll('rect')
                        .classed('selected', false)
                        .classed('deselected', true);
                } else {
                    g.selectAll('rect')
                        .classed('selected', function (d) { return d.key >= minValue; })
                        .classed('deselected', function (d) { return d.key < minValue; });
                }
            };

            // // ensure histogram data is sorted by key
            state.histogramData.sort(function (a, b) {
                return d3.ascending(a.key, b.key);
            });

            // histogram rectangles
            // JOIN
            var bar = g.selectAll('rect')
                .data(state.histogramData);

            // ENTER
            bar.enter()
                .append('rect');

            // ENTER + UPDATE
            bar
                .attr('x', function (d) { return x(d.key); })
                .attr('y', function (d) { return y(d.value); })
                .attr('width', x.rangeBand())
                .attr('height', function (d) { return y(0) - y(d.value); })
                .on('mouseover', function (d) {
                    // base colouring on current element's key
                    selectBasedOn(g, d.key);
                })
                .on('mouseout', function (d) {
                    // base colouring on level
                    selectBasedOn(g, state.level);
                })
                .on('click', function (d) {
                    state.setLevel(d.key);
                    // Note: Need to trigger a digest cycle here
                    scope.$apply();
                    selectBasedOn(g, d.key);
                });

            // EXIT
            bar.exit()
                .remove();

            // set selection state
            selectBasedOn(g, state.level);
        };


        return {
            restrict: 'E',
            scope: {
                facet: '='
            },
            templateUrl: 'facets/primitives/histogram-slider-facet-primitive.html',
            link: function (scope, elem, attrs) {
                var ngSvg = elem.find('svg')[0];
                var svg = d3.select(ngSvg);

                // TODO: set width based on parent width
                var width = 200;
                var height = 120;

                function scopeToState (scope) {
                    return {
                        histogramData: scope.facet.histogramData,
                        min: scope.facet.min,
                        max: scope.facet.max,
                        level: scope.facet.level,
                        setLevel: scope.facet.setLevel
                    };
                }

                render(scope, scopeToState(scope), svg, width, height);

                // ensure a re-render occurs on level/data change
                scope.$watchCollection('facet.histogramData', function () {
                    render(scope, scopeToState(scope), svg, width, height);
                });
                scope.$watch('facet.level', function () {
                    render(scope, scopeToState(scope), svg, width, height);
                });
            }
        };
    }]);
