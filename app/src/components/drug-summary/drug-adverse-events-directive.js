angular.module('otDirectives')
    .directive('otDrugAdverseEventsDirective', ['$http', 'otApi', '$timeout', '$log', function ($http, otApi, $timeout, $log) {
        'use strict';

        return {
            restrict: 'E',
            template: '<div id="drug-adverse-events" style="position:relative"></div>',
            scope: {
                drug: '='
            },
            link: function (scope, element) {
                scope.$watch('drug', function () {
                    if (!scope.drug) {
                        return;
                    }

                    // width calculation
                    var width = 0;
                    var e = element[0];
                    while (true) {
                        var p = e.parentNode;
                        if (p.offsetWidth) {
                            width = p.offsetWidth;
                            break;
                        }
                        if (e.parentNode) {
                            e = p;
                        } else {
                            break;
                        }
                    }

                    var drugName = scope.drug;
                    $http.get('https://api.fda.gov/drug/event.json?search=(primarysource.qualification:1+OR+primarysource.qualification:2+OR+primarysource.qualification:3)+AND+patient.drug.medicinalproduct:' + drugName + '&count=patient.reaction.reactionmeddrapt.exact')
                        .then(function (fdaResp) {
                            return fdaResp.data.results.slice(0, 20);
                        })
                        .then(function (events20) {
                            var eventNames = events20.map(function (e) {
                                e.term = e.term.charAt(0).toUpperCase() + e.term.slice(1).toLowerCase();
                                return e.term;
                            });
                            var opts = {
                                q: eventNames,
                                filter: 'disease',
                                fields: ['efo_code', 'efo_label']
                            };
                            var queryObject = {
                                method: 'POST',
                                params: opts
                            };

                            if (opts.q.length > 0) {    // check manually that we're not passing an empty query to getBesthitSearch
                                otApi.getBestHitSearch(queryObject) // no need to return this
                                    .then(function (resp) {
                                        for (var i = 0; i < resp.body.data.length; i++) {
                                            var rec = resp.body.data[i];
                                            if (rec.data && rec.exact) {
                                                events20[i].label = rec.data.efo_label;
                                                events20[i].id = rec.data.efo_code;
                                            }
                                        }
                                        // scope.effects = events20;
                                        $timeout(function () {
                                            plotAdverseEvents(events20, width);
                                        }, 0);
                                    });
                            }
                        })
                        .catch(function (err) {
                            // It seems that api.fda.gov can return a 404 here. Also getBestHitSearch() can return error if the query is empty
                            // Trying to catch errors in the above code here: however the first 404 seems to make it through...
                            $log.log('Drugs adverse event error: ', err);
                        });
                });

                function plotAdverseEvents (events, w) {
                    var longestName = -Infinity;
                    events.forEach(function (d) {
                        if (d.term.length > longestName) {
                            longestName = d.term.length;
                        }
                    });

                    var svg = d3.select('#drug-adverse-events')
                        .append('svg')
                        .attr('width', (w - 50))
                        .attr('height', (events.length * 20) + 100)
                        .append('g')
                        .attr('class', 'adverseEvents')
                        .attr('transform', 'translate(50, 70)');

                    // Caption
                    svg.append('g')
                        .attr('transform', 'translate(0, -50)')
                        .append('text')
                        .style('font-size', '1.2em')
                        .style('fill', '#666666')
                        .text('Number of reports');

                    var valScale = d3.scale.linear()
                        .domain([0, d3.max(events, function (d) { return d.count; })])
                        .range([0, ~~(w - (longestName * 12))]);

                    var colScale = d3.scale.category20();

                    var reports = svg.selectAll('.report')
                        .data(events)
                        .enter()
                        .append('g')
                        .attr('class', 'report')
                        .attr('transform', function (d, i) {
                            return 'translate(0,' + (i * 20) + ')';
                        });

                    // bars
                    var reportTooltip;
                    reports
                        .append('rect')
                        .attr('x', 0)
                        .attr('y', 0)
                        .attr('width', function (d) {
                            return valScale(d.count);
                        })
                        .attr('height', 10)
                        .attr('fill', function (d, i) {
                            return colScale(1); // in case we have more than 20 adverse effects
                        })
                        .on('mouseover', function (d) {
                            var obj = {
                                body: d.count + ' reports'
                            };
                            reportTooltip = tooltip.plain()
                                .width(220)
                                .show_closer(false)
                                .call(this, obj);
                        })
                        .on('mouseout', function () {
                            reportTooltip.close();
                        });

                    // text
                    reports
                        .append('text')
                        .attr('x', function (d) {
                            return valScale(d.count) + 10;
                        })
                        .attr('y', 0)
                        .style('alignment-baseline', 'hanging')
                        .text(function (d) {
                            return d.term;
                        });

                    // Axes
                    // values axis
                    var valAxis = d3.svg.axis()
                        .scale(valScale)
                        .orient('top')
                        .ticks(5);
                    svg
                        .append('g')
                        .attr('class', 'axis')
                        .attr('transform', 'translate(0,' + (-10) + ')')
                        .call(valAxis);
                }
            }
        };
    }]);
