/**
 * Donut chart
 * A directive to display a donut chart
 * @param {string} header - the text to be display in a heading. Optional.
 * @param {array} data - the data to use for building the chart. Each item in array is in format {label:string, value:number}.
 * @param {boolean} showLegend - true to display legend; false to display labels over each arc of the chart.
 * @param {function} scale - the D3 scale to use for color. Optional.
 * @param {number} size - external width or height (i.e. the diameter). Optional
 * @param {number} hole - the diameter of internal donut 'hole'. Optional
 */
angular.module('otDirectives')

    .directive('otStackChart', [function () {
        'use strict';

        return {
            restrict: 'AE',
            templateUrl: 'src/components/stack-chart/stack-chart.html',
            scope: {
                header: '@?',       // optional header
                data: '=',
                // showLegend: '<?',   // optional show legend (else labels added to chart arcs) -- one-way binding
                scale: '=?',    // optional color scale
                width: '<?',     // optional width
                height: '<?'      // optional height
            },
            link: function (scope, elem, attrs) {
                scope.$watch('data', function (n, o) {
                    // wait until we have data
                    if (n === undefined) { return; }

                    // setup default attributes
                    var data = scope.data;
                    var color = scope.scale || d3.scale.category20();
                    var width = scope.width || 300,
                        height = scope.height || 250;

                    // update data
                    // id: can be used to pass a different value to calculate color on
                    // color: can be used to pass a specific color for each arc
                    data.forEach(function (e) {
                        e.id = e.id || e.label;
                        // e.color = e.color || color(e.id);
                        e.total = e.values.reduce(function (a, b) { return a + b.value; }, 0);
                        e.values.sort(function (a, b) { return a.id > b.id; }); // sort alphabetically
                    });
                    data.sort(function (a, b) { return b.total > a.total; });

                    // generate array of unique activities in the data
                    var activities = data
                        .reduce(function (acc, i) {
                            i.values.forEach(function (j) {
                                acc.push(j.id);
                            });
                            return acc;
                        }, [])
                        .filter(function (value, index, self) {
                            return self.indexOf(value) === index;
                        })
                        .sort(function (a, b) { return a.id > b.id; }); // sort alphabetically

                    // setup SVG
                    var margin = {top: 10, right: 0, bottom: 60, left: 50},
                        width = width - margin.left - margin.right,
                        height = height - margin.top - margin.bottom;

                    var x = d3.scale.ordinal()
                        .rangeRoundBands([0, width], 0.05, 0);

                    var y = d3.scale.linear()
                        // .rangeRound([height, 0]);
                        .range([height, 0]);

                    var z = d3.scale.category20();

                    var xAxis = d3.svg.axis()
                        .scale(x)
                        .orient('bottom');
                        // .tickFormat(d3.time.format('%b'));

                    var yAxis = d3.svg.axis()
                        .scale(y)
                        .orient('left');

                    var svg = d3.select(elem[0].querySelector('svg'))
                        .attr('width', width + margin.left + margin.right)
                        .attr('height', height + margin.top + margin.bottom)
                        .append('g')
                        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


                    // var layers = d3.layout.stack()(causes.map(function (c) {
                    //     return crimea.map(function (d) {
                    //         return {x: d.date, y: d[c]};
                    //     });
                    // }));
                    var layers = d3.layout.stack()(activities.map(function (c, i) {
                        return data.map(function (d) {
                            return {
                                x: d.label,
                                y: (d.values[i] || {value: 0}).value,
                                id: c,
                                value: (d.values[i] || {value: 0}).value
                            };
                        });
                    }));

                    // x.domain(layers[0].map(function (d) { return d.x; }));
                    // y.domain([0, d3.max(layers[layers.length - 1], function (d) { return d.y0 + d.y; })]).nice();
                    x.domain(data.map(function (i) { return i.label; }));
                    y.domain([0, d3.max(data, function (d) { return d.total; })]).nice();

                    var layer = svg.selectAll('.layer')
                        .data(layers)
                        .enter().append('g')
                        .attr('class', 'layer')
                        .style('fill', function (d, i) { return z(i); });

                    layer.selectAll('rect')
                        .data(function (d) { return d; })
                        .enter().append('rect')
                        .attr('x', function (d) { return x(d.x); })
                        .attr('y', function (d) { return y(d.y + d.y0); })
                        .attr('height', function (d) { return Math.ceil(y(d.y0) - y(d.y + d.y0)); })
                        .attr('width', x.rangeBand() - 1)
                        .append('title')
                        .text(function (d) { return d.id + ' (' + d.value + ')'; });

                    svg.append('g')
                        .attr('class', 'axis axis--x')
                        .attr('transform', 'translate(0,' + (height + 1) + ')')
                        .call(xAxis)
                        .selectAll('text')
                        .attr('y', 10)
                        .attr('x', -4)
                        .attr('dy', '.35em')
                        .attr('transform', 'rotate(-30)')
                        .style('text-anchor', 'end');

                    svg.append('g')
                        .attr('class', 'axis axis--y')
                        .attr('transform', 'translate(0,0)')
                        .call(yAxis);

                    // expose activities
                    scope.activities = activities.map(function (d, i) {
                        return {
                            id: d,
                            color: z(i)
                        };
                    });
                });
            }
        };
    }]);
