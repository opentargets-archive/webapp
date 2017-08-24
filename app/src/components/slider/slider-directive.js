angular.module('cttvDirectives')
    /**
     * A generic slider
     */
    .directive('otSlider', ['otUtils', function (otUtils) {
        // 'use strict';

        return {

            restrict: 'AE',

            scope: {
                min: '@?',
                max: '@?',
                value: '=?',    // optional initial position, or min if nothing specified
                config: '=?'    // optional configuration:
                // tick: Number
                // ticks: Number
                // snap: Boolean
                // mode: String ["linear" | "ordinal"]
                // values: Array
                // labels: Array
            },

            // template: '<ot-size-listener onresize="resize"></ot-size-listener>',

            /*
            link: function (scope, elem, attrs) {

                // set up dimentions
                var margin = {top: 0, right: 10, bottom: 10, left: 10},
                    width = (scope.config.width || elem[0].offsetWidth) - margin.left - margin.right,   // initialize width to the div width
                    height = 30 - margin.bottom - margin.top;

                var config = scope.config || {}


                var tick = config.tick;
                var ticks = config.ticks || (scope.max-scope.min)/tick;
                var snap = config.snap || false;

                scope.value = scope.value || scope.min;


                var x = d3.scale.linear()
                    .domain([scope.min, scope.max])
                    .range([0, width])
                    .clamp(true);

                var brush = d3.svg.brush()
                    .x(x)
                    .extent([0, 0])
                    .on("brush", onBrush);

                var xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom")
                    .ticks(ticks)
                    //.tickFormat(function(d) { return d + "°"; })
                    .tickSize(0)
                    .tickPadding(12);

                var svg = d3.select(elem.eq(0)[0]).append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height / 2 + ")")
                    .call(xAxis)
                    .select(".domain")
                    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
                    .attr("class", "halo");

                    svg.attr("viewBox", "0 0 " + width + " " + height)
                    .attr("perserveAspectRatio", "xMinYMin");
                    //.call(scope.resize);


                var slider = svg.append("g")
                    .attr("class", "slider")
                    .call(brush);

                slider.selectAll(".extent,.resize")
                    .remove();

                var handle = slider.append("circle")
                    .attr("class", "handle")
                    .attr("transform", "translate(0," + height / 2 + ")")
                    .attr("r", 9);

                // init: move slider to initial position
                slider
                    .call(brush.event)
                    //.transition() // gratuitous intro!
                    //.duration(750)
                    .call(brush.extent([scope.value, scope.value]))
                    .call(brush.event);

                // attach event after initial animation is triggered (hack, I confess)
                brush.on("brushend", function(){ scope.$apply(onBrushEnd) });

                function onBrush() {
                    var value = brush.extent()[0];

                    if (d3.event.sourceEvent) { // not a programmatic event
                        value = x.invert(d3.mouse(this)[0]);
                        if(snap){
                            value = otUtils.roundToNearest( value, tick );
                        }
                        brush.extent([value, value]);
                    }

                    // move the handle
                    handle.attr("cx", x(value));
                }

                function onBrushEnd() {
                    // update the scope value when finishing brushing
                    if (d3.event.sourceEvent) { // not a programmatic event
                        scope.value = brush.extent()[0];
                    }
                }

                scope.resize=function(dim){
                    width = dim.w - margin.left - margin.right,   // initialize width to the div width

                    x.domain([scope.min, scope.max])
                    .range([0, width]);

                    svg.attr("width", width + margin.left + margin.right);

                }

            },*/

            link: function (scope, elem) {
                scope.$watch('value', function (n, o) {
                    if (n !== undefined && o === undefined) {
                        // set up dimentions
                        var margin = {top: 0, right: 10, bottom: 10, left: 10},
                            width = (scope.config.width || elem[0].offsetWidth) - margin.left - margin.right,   // initialize width to the div width
                            height = 35 - margin.bottom - margin.top;

                        // check the configuration
                        var config = scope.config || {};

                        var ticks = config.ticks || config.values.length || 10;
                        var tick = config.tick || 1;
                        var snap = config.snap || false;
                        var values = config.values || [(scope.min || 0), (scope.max || 1)];
                        var labels = config.labels;

                        scope.value = scope.value || scope.min;

                        // the scale/mapping of actual values that the slider is returning
                        var v = d3.scale.linear()
                            .domain(values.map(function (item, i) { return i; }))
                            .range(values.map(function (item) { return item; }))
                            .clamp(true);

                        // the scale of the slider, 0 to 1 and 0 to width
                        var x = d3.scale.linear()
                            .domain([0, (ticks - 1)])
                            .range([0, width])
                            .clamp(true);

                        var brush = d3.svg.brush()
                            .x(x)
                            .extent([0, 0])
                            .on('brush', onBrush);


                        var xAxis = d3.svg.axis()
                            .scale(x)
                            .orient('bottom')
                            .ticks(ticks)
                            .tickFormat(function (d) {
                                // return d+"\""; // config.labels[d] || ;
                                return labels[d];
                            })
                            .tickSize(0)
                            .tickPadding(12);


                        var svg = d3.select(elem.eq(0)[0]).append('svg')
                            .attr('width', width + margin.left + margin.right)
                            .attr('height', height + margin.top + margin.bottom)
                            .append('g')
                            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

                        svg.append('g')
                            .attr('class', 'x axis')
                            .attr('transform', 'translate(0,' + height / 2 + ')')
                            .call(xAxis)
                            .select('.domain')
                            .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
                            .attr('class', 'halo');

                        var slider = svg.append('g')
                            .attr('class', 'slider')
                            .call(brush);

                        slider.selectAll('.extent,.resize')
                            .remove();

                        var handle = slider.append('circle')
                            .attr('class', 'handle')
                            .attr('transform', 'translate(0,' + height / 2 + ')')
                            .attr('r', 7);

                        // init: move slider to initial position
                        slider
                            .call(brush.event)
                            .call(brush.extent([v.invert(scope.value), v.invert(scope.value)]))
                            .call(brush.event);

                        // attach event after initial animation is triggered (hack, I confess)
                        brush.on('brushend', function () { scope.$apply(onBrushEnd); });

                        var onBrush = function () {
                            var value = brush.extent()[0];

                            if (d3.event.sourceEvent) { // not a programmatic event
                                value = x.invert(d3.mouse(this)[0]);
                                if (snap) {
                                    value = otUtils.roundToNearest(value, tick);
                                }
                                brush.extent([value, value]);
                            }

                            // move the handle
                            handle.attr('cx', x(value));
                        };

                        var onBrushEnd = function () {
                            // update the scope value when finishing brushing
                            if (d3.event.sourceEvent) { // not a programmatic event
                                scope.value = v(brush.extent()[0]);
                            }
                        };
                    }
                });


                /* scope.resize=function(dim){
                    width = dim.w - margin.left - margin.right,   // initialize width to the div width

                    x.domain([scope.min, scope.max])
                    .range([0, width]);

                    svg.attr("width", width + margin.left + margin.right);

                }*/
            }
        };
    }]);
