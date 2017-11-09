angular.module('otPlugins')
    .directive('otRelatedTargets', [function () {
        'use strict';
        return {
            restrict: 'E',
            templateUrl: 'plugins/related-entities/related-targets.html',
            scope: {
                target: '=',
                width: '='
            },
            link: function (scope) {
                scope.entitySymbol = scope.target.symbol;
                scope.entity = 'target';
            }
        }
    }]);

angular.module('otPlugins')
    .directive('otRelatedDiseases', [function () {
        'use strict';
        return {
            restrict: 'E',
            templateUrl: 'plugins/related-entities/related-diseases.html',
            scope: {
                disease: '=',
                width: '='
            },
            link: function (scope) {
                scope.entitySymbol = scope.disease.label;
                scope.entity = 'disease';
            }
        }
    }]);

angular.module('otDirectives')
    .directive('otRelatedDiseasesVis', ['otApi', '$q', 'otUtils', 'otConsts', function (otApi, $q, otUtils, otConsts) {
        'use strict';

        return {
            restrict: 'E',
            template: '<div></div>',
            scope: {
                disease: '=',
                related: '=',
                width: '='
            },
            link: function (scope, element) {
                scope.entitiesType = 'disease';
                scope.api = otApi;
                scope.utils = otUtils;
                scope.consts = otConsts;
                scope.q = $q;

                var id = scope.disease.efo;
                var opts = {
                    id: id,
                    size: 20
                };
                var queryObject = {
                    method: 'GET',
                    params: opts
                };
                otApi.getTargetRelation(queryObject)
                    .then(
                        // success
                        function (resp) {
                            // var container = document.getElementById('ot-relations-plot');
                            var container = element[0];
                            createVis(container, resp.body.data, scope);

                            // createRelationsTree(container, resp.body.data, scope);
                            // createRelationsTree(container, resp.body.data, (scope.width / 2), scope.target.approved_symbol, scope.entities);
                        },

                        // error handler
                        otApi.defaultErrorHandler
                    );
            }
        };
    }]);


angular.module('otDirectives')
    .directive('otRelatedTargetsVis', ['otApi', '$q', 'otUtils', 'otConsts', function (otApi, $q, otUtils, otConsts) {
        'use strict';

        return {
            restrict: 'E',
            template: '<div></div>',
            scope: {
                target: '=',
                related: '=',
                width: '='
            },
            link: function (scope, element) {
                scope.entitiesType = 'target';
                scope.api = otApi;
                scope.utils = otUtils;
                scope.consts = otConsts;
                scope.q = $q;

                var id = scope.target.id;
                var opts = {
                    id: id,
                    size: 20
                };
                var queryObject = {
                    method: 'GET',
                    params: opts
                };
                otApi.getTargetRelation(queryObject)
                    .then(
                        // success
                        function (resp) {
                            // var container = document.getElementById('ot-relations-plot');
                            var container = element[0];
                            createVis(container, resp.body.data, scope);

                            // createRelationsTree(container, resp.body.data, scope);
                            // createRelationsTree(container, resp.body.data, (scope.width / 2), scope.target.approved_symbol, scope.entities);
                        },

                        // error handler
                        otApi.defaultErrorHandler
                    );
            }
        };
    }]);


function createVis(container, data, scope) {
    var maxWidth = 600;
    var width = scope.width > maxWidth ? maxWidth : (scope.width * 0.9);
    var subject = scope.entitySymbol;
    var entitiesType = scope.entitiesType; // "target" | "disease"

    var treeData = getTreeData(subject, data, entitiesType);

    var pack = d3.layout.pack()
        .size([width, width])
        .sort(null)
        .padding(10)
        .value(function (d) {
            // return d.shared_count;
            return d.value;
        });
    var nodes = pack(treeData);
    var svg = d3.select(container)
        .append('div')
        .style('position', 'relative')
        .append('svg')
        .attr('width', width)
        .attr('height', width)
        .append('g');

    var bubbles = svg.selectAll('.relatedBubbles')
        .data(nodes, function (d) {
            return d.id;
        })
        .enter()
        .append('g')
        .attr('class', function (d) {
            if (d.parent) {
                return 'relatedBubble';
            } else {
                return 'rootRelatedBubble';
            }
        });

    // initial bubbles in the center and not shown
    // hover tooltip on track bars
    var sharedHoverTooltip;
    function showSharedHoverTooltip(data) {
        var obj = {};
        obj.header = data.object;

        var div = document.createElement('div');
        d3.select(div)
            .append('text')
            .style('font-size', '0.9em')
            .style('display', 'block')
            .text(data.shared_count + (data.entities_type === 'target' ? ' diseases' : ' targets') + ' shared with ' + data.subject);

        var container = d3.select(div)
            .append('div');

        var sets = [
            {sets: [data.subject], size: data.subject_counts},
            {sets: [data.object], size: data.object_counts},
            {sets: [data.subject, data.object], size: data.shared_count}
        ];

        var chart = venn.VennDiagram()
            .width(160)
            .height(160);
        container.datum(sets).call(chart);
        container.selectAll('.venn-circle path')
            .style('fill', '#b2def9')
            .style('stroke', '#005299')
            .style('stroke-width', '2px');
        container.selectAll('.venn-circle text')
            .style('fill', '#005299');


        obj.body = div.innerHTML;
        sharedHoverTooltip = tooltip.plain()
            .width(220)
            .show_closer(false)
            .call(this, obj);
    }

    function subject2objectData(object) {

        var subjId = object.subject_id;
        var objId = object.object_id;
        var subjSymbol = object.subject;
        var objSymbol = object.object;

        // Get the best 15 diseases|targets for target1|disease1 and get association details...
        var optsSubj;
        var optsObj;
        if (object.entities_type === 'target') {
            optsSubj = {
                target: [subjId],
                disease: object.shared.slice(0, 15),
                size: 15
            };
            optsObj = {
                target: [objId],
                disease: object.shared.slice(0, 15),
                size: 15
            };
        } else {
            optsSubj = {
                target: object.shared.slice(0, 15),
                disease: [subjId],
                size: 15
            };
            optsObj = {
                target: object.shared.slice(0, 15),
                disease: [objId], // ??
                size: 15
            };
        }

        var querySubj = {
            method: 'POST',
            trackCall: false,
            params: optsSubj
        };

        var queryObj = {
            method: 'POST',
            trackCall: false,
            params: optsObj
        };

        var otApi = scope.api;
        var $q = scope.q;

        var subjPromise = otApi.getAssociations(querySubj);
        var objPromise = otApi.getAssociations(queryObj);
        $q.all([subjPromise, objPromise])
            .then(function (resps) {
                var shared = {};
                // var missingShared = {};
                //
                // missingShared[subjId] = {};
                // missingShared[objId] = {};
                resps[0].body.data.map(function (d) {
                    var sharedLabel = (object.entities_type === 'target' ? d.disease.efo_info.label : d.target.gene_info.symbol);
                    var sharedId = (object.entities_type === 'target' ? d.disease.id : d.target.id);

                    shared[sharedLabel] = {
                        id: sharedId,
                        label: sharedLabel
                    };
                    shared[sharedLabel][subjSymbol] = {
                        id: subjId,
                        label: subjSymbol,
                        score: d.association_score.overall,
                        datatypes: d.association_score.datatypes
                    };
                    shared[sharedLabel][objSymbol] = {
                        id: objId,
                        label: objSymbol,
                        // score is set to 0 here and to the real score in the next map
                        score: 0
                    };
                });

                resps[1].body.data.map(function (d) {
                    var sharedLabel = (object.entities_type === 'target' ? d.disease.efo_info.label : d.target.gene_info.symbol);
                    shared[sharedLabel][objSymbol].score = d.association_score.overall;
                    shared[sharedLabel][objSymbol].datatypes = d.association_score.datatypes;
                });

                var sharedArr = [];
                for (var shared1 in shared) {
                    if (shared.hasOwnProperty(shared1)) {
                        sharedArr.push(shared[shared1]);
                    }
                }

                function showAssociationsDetails(data) {
                    // Clone link to be moved to the middle
                    var topLevelElement = this.parentNode.parentNode.parentElement;
                    var linksG =this.parentNode.parentNode;
                    var braces1G = d3.select(topLevelElement)
                        .select('.braces1');
                    var braces2G = d3.select(topLevelElement)
                        .select('.braces2');
                    var linksGWidth = linksG.getBoundingClientRect().width;
                    // var bracesGWidth = braces1G.node().getBoundingClientRect().width;
                    var currLink = this.parentNode;
                    var clonedLink = currLink.cloneNode(true);
                    var clonedLinkOrigTranslate = d3.select(clonedLink).attr('transform');
                    var entityId = d3.select(clonedLink).attr('data-entity');

                    // Remove all links
                    d3.select(linksG).selectAll('.linkNode')
                        .transition()
                        .duration(1000)
                        .style('opacity', 0)
                        .each('end', function () {
                            d3.select(this).style('display', 'none');
                        });

                    // Move the cloned link to the middle
                    linksG.appendChild(clonedLink);

                    d3.select(clonedLink)
                        .transition()
                        .duration(1000)
                        .attr('transform', 'translate(0, ' + yMid + ')')
                        .each('end', function () {
                            // Closer to the details (cross)
                            var textBBox = d3.select(clonedLink).select('text').node().getBBox();
                            var crossX = textBBox.x + textBBox.width + 6;
                            var crossY = textBBox.y;
                            var crossG = d3.select(clonedLink)
                                .append('g')
                                .attr('transform', 'translate(' + crossX + ','+ crossY + ')')
                                .on('click', function () {
                                    // Remove the details view (barChart or flowerViews)
                                    barChart.remove();

                                    // Remove the X
                                    d3.select(this).remove();

                                    // Move the shared entity link group to its place
                                    d3.select(clonedLink)
                                        .transition()
                                        .duration(1000)
                                        .attr('transform', clonedLinkOrigTranslate);

                                    // and the braces
                                    d3.select(clonedBrace1)
                                        .transition()
                                        .duration(1000)
                                        .attr('d', function () {
                                            return brace1OrigPath;
                                        });
                                    d3.select(clonedBrace2)
                                        .transition()
                                        .duration(1000)
                                        .attr('d', function () {
                                            return brace2OrigPath;
                                        })
                                        .each('end', function () {
                                            // Show all the links and braces again
                                            braces1G
                                                .selectAll('path')
                                                .style('display', 'block')
                                                .transition()
                                                .duration(1000)
                                                .style('opacity', 1);
                                            braces2G
                                                .selectAll('path')
                                                .style('display', 'block')
                                                .transition()
                                                .duration(1000)
                                                .style('opacity', 1);
                                            d3.select(linksG)
                                                .selectAll('.linkNode')
                                                .style('display', 'block')
                                                .transition()
                                                .duration(1000)
                                                .style('opacity', 1)
                                                .each('end', function () {
                                                    // and remove the cloned link and braces
                                                    d3.select(clonedLink)
                                                        .remove();
                                                    d3.select(clonedBrace1)
                                                        .remove();
                                                    d3.select(clonedBrace2)
                                                        .remove();
                                                });
                                        });

                                });
                            var crossSize = 4;
                            crossG
                                .append('circle')
                                .attr('cx', 0)
                                .attr('cy', 0)
                                .attr('r', crossSize * 1.5)
                                .style('cursor', 'pointer')
                                .style('fill', 'none')
                                .style('pointer-events', 'all')
                                .style('stroke', 'none');
                            crossG
                                .append('line')
                                .attr('x1', -crossSize)
                                .attr('y1', -crossSize)
                                .attr('x2', crossSize)
                                .attr('y2', crossSize)
                                .style('stroke-width', '2px')
                                .style('cursor', 'pointer')
                                .style('stroke', '#666666');
                            crossG
                                .append('line')
                                .attr('x1', -crossSize)
                                .attr('y1', crossSize)
                                .attr('x2', crossSize)
                                .attr('y2', -crossSize)
                                .style('stroke-width', '2px')
                                .style('cursor', 'pointer')
                                .style('stroke', '#666666');


                            // Instead of the flowers, try the vertical 2-way bar chart
                            var barScale = d3.scale.linear()
                                .domain([0, 1])
                                .range([0, linksGWidth / 2]);
                            var barChartHeight = yMid - (yMid / 2);
                            var barHeight = barChartHeight / scope.consts.datatypesOrder.length;
                            var barChart = d3.select(linksG)
                                .append('g')
                                .attr('transform', 'translate(0, ' + (yMid + 10) + ')');

                            // Tooltips
                            var subjEvidenceTooltip;
                            function showSubjEvidenceTooltip() {
                                var obj = {};
                                obj.header = subjSymbol + ' and ' + data.label;
                                obj.body = 'Click to obtain details on the association';
                                subjEvidenceTooltip = tooltip.plain()
                                    .width(180)
                                    .show_closer(false)
                                    .call(this, obj);
                            }
                            var objEvidenceTooltip;
                            function showObjEvidenceTooltip() {
                                var obj = {};
                                obj.header = objSymbol + ' and ' + data.label;
                                obj.body = 'Click to obtain details on the association';
                                objEvidenceTooltip = tooltip.plain()
                                    .width(180)
                                    .show_closer(false)
                                    .call(this, obj);
                            }

                            // View details links
                            barChart
                                .append('a')
                                .attr('xlink:href', function () {
                                    return '/evidence/' + (scope.entitiesType === 'target' ? subjId : data.id) + '/' + (scope.entitiesType === 'target' ? data.id : subjId);
                                })
                                .append('rect')
                                .attr('x', -barScale(1))
                                .attr('y', -3)
                                .attr('width', barScale(1))
                                .attr('height', barHeight * scope.consts.datatypesOrder.length + 1)
                                .style('stroke-width', '1px')
                                .style('stroke', '#dddddd')
                                .style('fill', 'none')
                                .style('pointer-events', 'all')
                                .on('mouseover', function () {
                                    showSubjEvidenceTooltip.call(this);
                                    d3.select(this)
                                        .style('fill', '#fff6ff');
                                })
                                .on('mouseout', function () {
                                    subjEvidenceTooltip.close();
                                    d3.select(this)
                                        .style('fill', 'none');
                                });

                            barChart
                                .append('a')
                                .attr('xlink:href', function () {
                                    return '/evidence/' + (scope.entitiesType === 'target' ? objId : data.id) + '/' + (scope.entitiesType === 'target' ? data.id : objId);
                                })
                                .append('rect')
                                .attr('x', 0)
                                .attr('y', -3)
                                .attr('width', barScale(1))
                                .attr('height', barHeight * scope.consts.datatypesOrder.length + 1)
                                .style('stroke-width', '1px')
                                .style('stroke', '#dddddd')
                                .style('fill', 'none')
                                .style('pointer-events', 'all')
                                .on('mouseover', function () {
                                    showObjEvidenceTooltip.call(this);
                                    d3.select(this)
                                        .style('fill', '#fff6ff');
                                })
                                .on('mouseout', function () {
                                    objEvidenceTooltip.close();
                                    d3.select(this)
                                        .style('fill', 'none');
                                });

                            var bars = barChart.selectAll('.bars')
                                .data(scope.consts.datatypesOrder);
                            var barG = bars
                                .enter()
                                .append('g')
                                .style('pointer-events', 'none')
                                .attr('transform', function (d, i) {
                                    return 'translate(0, ' + (i * barHeight) + ')';
                                });

                            // Subj bars
                            barG
                                .append('rect')
                                .attr('x', 0)
                                .attr('y', 0)
                                .attr('width', 0)
                                .attr('height', barHeight - (barHeight / 4))
                                .attr('fill', '#c8ebc7')
                                .attr('stroke-width', '1px')
                                // .attr('stroke', '#006400');
                                // .attr('stroke', '#c8ebc7');
                                .attr('stroke', d3.rgb('#c8ebc7').darker())
                                .transition()
                                .duration(500)
                                .attr('x', function (d) {
                                    return -(barScale(data[subjSymbol].datatypes[scope.consts.datatypes[d].id]));
                                })
                                .attr('width', function (d) {
                                    return barScale(data[subjSymbol].datatypes[scope.consts.datatypes[d].id]);
                                });

                            // Obj bars
                            barG
                                .append('rect')
                                .attr('x', 0)
                                .attr('y', 0)
                                .attr('width', 0)
                                .attr('height', barHeight - (barHeight / 4))
                                .attr('fill', '#b2def9')
                                .attr('stroke-width', '1px')
                                // .attr('stroke', '#005299');
                                // .attr('stroke', '#b2def9');
                                .attr('stroke', d3.rgb('#b2def9').darker())
                                .transition()
                                .duration(500)
                                .attr('width', function (d) {
                                    return barScale(data[objSymbol].datatypes[scope.consts.datatypes[d].id]);
                                });


                            // Datatypes labels
                            barG
                                .append('text')
                                .attr('x', 0)
                                .attr('y', ((barHeight - (barHeight / 4)) / 2))
                                .style('font-size', '0.8em')
                                .style('fill', '#333333')
                                .style('text-anchor', 'middle')
                                .attr('alignment-baseline', 'middle')
                                .style('cursor', 'pointer')
                                .text(function (d) {
                                    // return scope.consts.datatypesLabels[d];
                                    return scope.consts.datatypes[d].label;
                                });
                        });

                    // Clone left brace to be moved to the middle
                    var brace1 = d3.select(topLevelElement)
                        .select('.braces1')
                        .select('path[data-entity="' + entityId + '"]');
                    var clonedBrace1 = brace1.node().cloneNode(true);

                    // Hide all the left braces
                    braces1G
                        .selectAll('path')
                        .transition()
                        .duration(1000)
                        .style('opacity', 0)
                        .each('end', function () {
                            d3.select(this).style('display', 'none');
                        });

                    // Move the cloned left brace to the middle
                    braces1G.node().appendChild(clonedBrace1);
                    var brace1OrigPath = d3.select(clonedBrace1)
                        .attr('d');
                    d3.select(clonedBrace1)
                        .transition()
                        .duration(1000)
                        .attr('d', function () {
                            return 'M0,' + (yMid) + ' C' + (bracesOffset) + ',' + (yMid) + ' 0,' + (yMid) + ' ' + (bracesOffset) + ',' + (yMid);
                        });

                    // Same for the right brace
                    var brace2 = d3.select(topLevelElement)
                        .select('.braces2')
                        .select('path[data-entity="' + entityId + '"]');
                    var clonedBrace2 = brace2.node().cloneNode(true);
                    var brace2OrigPath = d3.select(clonedBrace2)
                        .attr('d');

                    // Remove all the left braces
                    braces2G
                        .selectAll('path')
                        .transition()
                        .duration(1000)
                        .style('opacity', 0)
                        .each('end', function () {
                            d3.select(this).style('display', 'none');
                        });

                    // Move the cloned left brace to the middle
                    braces2G.node().appendChild(clonedBrace2);
                    d3.select(clonedBrace2)
                        .transition()
                        .duration(1000)
                        .attr('d', function () {
                            return 'M0,' + (yMid) + ' C' + (-bracesOffset) + ',' + (yMid) + ' 0,' + (yMid) + ' ' + (-bracesOffset) + ',' + (yMid);
                        })
                }

                var bracesOffset = width / 12;
                var labelOffset = (2 * (width / 12));
                var linksOffset = 6 * (width / 12);
                var vOffset = 20;

                var otUtils = scope.utils;
                var colorScaleObj = otUtils.colorScales.BLUE_0_1; // blue orig
                // TODO: Change to d3.scaleLinear when using d3.v4
                var colorScaleSubj = d3.scale.linear()
                    .domain([0, 1])
                    // .range(['#c8ebc7', '#5ba633']);
                    .range(['#c8ebc7', '#006400']);

                // TODO: Change to d3.scaleLinear
                // var xScale = d3.scale.linear()
                //     .domain([-1, 1])
                //     .range([-linksOffset / 2, linksOffset / 2]);

                // TODO: Change to d3.scaleLinear when using d3.v4
                var yScale = d3.scale.linear()
                    .range([0, width - (vOffset * 2)])
                    .domain([0, sharedArr.length - 1]);

                if (sharedArr.length === 1) {
                    yScale.range([(width / 2) - vOffset, (width / 2) - vOffset]);
                }
                var yMid = yScale((sharedArr.length / 2) - 0.5);


                var detailsG = svg
                    .append('g')
                    .attr('class', 'detailsView')
                    .attr('transform', 'translate(0, ' + vOffset + ')');

                var linksG = detailsG
                    .append('g')
                    .attr('class', 'links')
                    .attr('transform', 'translate(' + (labelOffset + bracesOffset + (linksOffset / 2)) + ', 0)');
                var linkNodes = linksG.selectAll('.linkNode')
                    .data(sharedArr)
                    .enter()
                    .append('g')
                    .attr('data-entity', function (d) {
                        return d.id;
                    })
                    .attr('class', 'linkNode')
                    .attr('transform', 'translate(0,' + (yMid) + ')');

                // subject
                linkNodes
                    .append('line')
                    .attr('x1', -linksOffset / 2)
                    .attr('x2', 0)
                    // .attr('x2', function (d) {
                    //     return xScale((d[objSymbol].score - d[subjSymbol].score))
                    // })
                    .attr('y1', 0)
                    .attr('y2', 0)
                    .style('stroke-width', '2px')
                    .style('stroke', function (d) {
                        return colorScaleSubj(d[subjSymbol].score);
                    });

                // object
                linkNodes
                    .append('line')
                    .attr('x1', 0)
                    // .attr('x1', function (d) {
                    //     return xScale((d[objSymbol].score - d[subjSymbol].score))
                    // })
                    .attr('x2', linksOffset / 2)
                    .attr('y1', 0)
                    .attr('y2', 0)
                    .style('stroke-width', '2px')
                    .style('stroke', function (d) {
                        return colorScaleObj(d[objSymbol].score);
                    });

                // labels for links
                linkNodes
                    .append('text')
                    .attr('x', 0)
                    .attr('y', -8)
                    .attr('text-anchor', 'middle')
                    .attr('fill', '#666666')
                    .style('opacity', 0)
                    .style('cursor', 'pointer')
                    .style('font-size', '0.9em')
                    .text(function (d) {
                        var n = linksOffset / 6;
                        var l = d.label;
                        if (l.length > n) {
                            l = l.substring(0, n) + ' ...';
                        }
                        return l;
                    })
                    .on('click', showAssociationsDetails);


                // scaled circle
                linkNodes
                    .append('circle')
                    .attr('cx', 0)
                    // .attr('cx', function (d) {
                    //     return xScale((d[objSymbol].score - d[subjSymbol].score))
                    // })
                    .attr('cy', 0)
                    .attr('r', 5)
                    .style('fill', '#FFFFFF')
                    .style('stroke', '#666666')
                    .style('stroke-width', '2px')
                    .style('cursor', 'pointer')
                    .on('click', showAssociationsDetails);

                // nodes for links
                // linkNodes
                //     .append('circle')
                //     .attr('cx', 0)
                //     .attr('cy', 0)
                //     .attr('r', 5)
                //     // .attr('fill', color)
                //     .attr('fill', '#FFFFFF')
                //     .style('stroke', '#666666')
                //     .style('stroke-width', '2px')
                //     .style('cursor', 'pointer')
                //     .on('click', showAssociationsTooltip);

                var linksTransition = linkNodes
                    .transition()
                    .duration(1000)
                    .delay(function (d, i) {
                        return i*100;
                    })
                    .attr('transform', function (d, i) {
                        // return 'translate(0,' + (i * (width / sharedArr.length)) + ')';
                        // console.log(sharedArr.length + ' -- ' + width + '(' + i + ') => ' + yScale(i));
                        return 'translate(0,' + yScale(i) + ')';
                    });
                linksTransition.select('text')
                    .style('opacity', 1);


                // braces1
                var braces1 = detailsG
                    .append('g')
                    .attr('class', 'braces1')
                    .attr('transform', 'translate(' + (labelOffset) + ',0)');
                braces1.selectAll('.braces1')
                    .data(sharedArr)
                    .enter()
                    .append('path')
                    .attr('data-entity', function (d) {
                        return d.id;
                    })
                    .attr('d', function () {
                        // return 'M0,' + (height / 2) + ' C' + (bracesOffset) + ',' + (height / 2) + ' 0,' + ((i * 30)) + ' ' + (bracesOffset) + ',' + ((i * 30));
                        return 'M0,' + (yMid) + ' C' + (bracesOffset) + ',' + (yMid) + ' 0,' + (yMid) + ' ' + (bracesOffset) + ',' + (yMid);
                    })
                    .attr('fill', 'none')
                    .style('stroke-width', '2px')
                    .attr('stroke', function (d) {
                        return colorScaleSubj(d[subjSymbol].score);
                    });
                braces1
                    .selectAll('path')
                    .transition()
                    .duration(1000)
                    .delay(function (d, i) {
                        return i*100;
                    })
                    .attr('d', function (d, i) {
                        return 'M0,' + (yMid) + ' C' + (bracesOffset) + ',' + (yMid) + ' 0,' + (yScale(i)) + ' ' + (bracesOffset) + ',' + (yScale(i));
                    });

                // braces2
                var braces2 = detailsG
                    .append('g')
                    .attr('class', 'braces2')
                    .attr('transform', 'translate(' + (labelOffset + (bracesOffset*2) + linksOffset) + ',0)');
                braces2.selectAll('.braces2')
                    .data(sharedArr)
                    .enter()
                    .append('path')
                    .attr('data-entity', function (d) {
                        return d.id;
                    })
                    .attr('d', function () {
                        // return 'M0,' + (height / 2) + ' C' + (-bracesOffset) + ',' + (height / 2) + ' 0,' + ((i * 30)) + ' ' + (-bracesOffset) + ',' + ((i * 30));
                        return 'M0,' + (yMid) + ' C' + (-bracesOffset) + ',' + (yMid) + ' 0,' + (yMid) + ' ' + (-bracesOffset) + ',' + (yMid);
                    })
                    .attr('fill', 'none')
                    .style('stroke-width', '2px')
                    .attr('stroke', function (d) {
                        return colorScaleObj(d[objSymbol].score);
                    });
                braces2
                    .selectAll('path')
                    .transition()
                    .duration(1000)
                    .delay(function (d, i) {
                        return i*100;
                    })
                    .attr('d', function (d, i) {
                        return 'M0,' + (yMid) + ' C' + (-bracesOffset) + ',' + (yMid) + ' 0,' + (yScale(i)) + ' ' + (-bracesOffset) + ',' + (yScale(i));
                    });

            });
    }

    function clickedNode(data) {

        // Create a new node for the subject
        // 1 find the top level element to place this new node
        var topLevelElement = this.parentNode.parentNode;
        var subject = (scope.entitiesType === 'target' ? scope.target : scope.disease);
        var subjLabel = (scope.entitiesType === 'target' ? subject.approved_symbol : subject.label);
        var labelOffset = width / 12;

        // places for the subject and object:
        var subjX = labelOffset;
        var objX = width - labelOffset;

        // Fade out all not selected nodes
        d3.select(topLevelElement).selectAll('.relatedBubble')
            .transition()
            .duration(1000)
            .style('opacity',0)
            .each('end', function (d) {
                d3.select(this).style('display', 'none');
            });

        var subjLabelTooltip;
        function showSubjLabelTooltip() {
            var obj = {};
            obj.header = '';
            obj.body = subjLabel;
            subjLabelTooltip = tooltip.plain()
                .width(180)
                .show_closer(false)
                .call(this, obj);
        }

        // Create a subject node
        var subjectNode = d3.select(topLevelElement)
            .append('g')
            // .attr('class', 'relatedBubble');
            .attr('class', 'relatedSubjectNode')
            .on('mouseover', showSubjLabelTooltip)
            .on('mouseout', function () {
                subjLabelTooltip.close();
            });
        var subjCircleNode = subjectNode
            .append('circle')
            .attr('cx', - labelOffset)
            .attr('cy', (width / 2))
            .attr('r', labelOffset - 5);
        var subjLabelNode = subjectNode
            .append('text')
            .attr('x', - labelOffset)
            .attr('y', (width / 2))
            .text(getText(subjLabel, data.r - 5));

        // Move the subject to its place
        subjCircleNode
            .transition()
            .duration(1000)
            .attr('cx', subjX);
        subjLabelNode
            .transition()
            .duration(1000)
            .attr('x', subjX);

        // Create an object node
        var clickedNode = d3.select(this);
        var clickedNodeOrigX = clickedNode.attr('cx');
        var clickedNodeOrigY = clickedNode.attr('cy');
        var clickedNodeOrigR = clickedNode.attr('r');

        var objLabelTooltip;
        function showObjLabelTooltip() {
            var obj = {};
            obj.header = '';
            obj.body = data.name;
            objLabelTooltip = tooltip.plain()
                .width(180)
                .show_closer(false)
                .call(this, obj);
        }

        var objectNode = d3.select(topLevelElement)
            .append('g')
            .attr('class', 'relatedBubble')
            .on('mouseover', showObjLabelTooltip)
            .on('mouseout', function () {
                objLabelTooltip.close();
            });
        var objCircleNode = objectNode
            .append('circle')
            .attr('cx', clickedNodeOrigX)
            .attr('cy', clickedNodeOrigY)
            .attr('r', clickedNodeOrigR);
        var objLabelNode = objectNode
            .append('text')
            .attr('x', clickedNodeOrigX)
            .attr('y', clickedNodeOrigY)
            .text(getText(data.object, clickedNodeOrigR));

        // Move the object to its place
        objCircleNode
            .transition()
            .duration(1000)
            .attr('cx', objX)
            .attr('cy', (width / 2))
            .attr('r', labelOffset - 5);
        objLabelNode
            .transition()
            .duration(1000)
            .attr('x', objX)
            .attr('y', (width / 2))
            .each('end', function () {
                // Add a way to deselect the node
                var crossG = objectNode
                    .append('g')
                    .attr('transform', 'translate(' + (objX + labelOffset - 10) + ',' + ((width / 2) - labelOffset + 10) + ')')
                    .on('click', function () {
                        // Remove the details view (links between subject and object)
                        d3.selectAll('.detailsView').remove();

                        // Remove the X
                        d3.select(this).remove();

                        // Move the subject node out of sight and remove them
                        subjCircleNode
                            .transition()
                            .duration(1000)
                            .attr('cx', -labelOffset - 3)
                            .each('end', function () {
                                subjCircleNode.remove();
                            });
                        subjLabelNode
                            .transition()
                            .duration(1000)
                            .attr('x', -labelOffset - 3)
                            .each('end', function () {
                                subjLabelNode.remove();
                            });

                        // Move the object node to its original place
                        objCircleNode
                            .transition()
                            .duration(1000)
                            .attr('cx', clickedNodeOrigX)
                            .attr('cy', clickedNodeOrigY)
                            .attr('r', clickedNodeOrigR)
                            .each('end', function () {
                                // restore the interaction with the nodes
                                d3.selectAll('.relatedBubble')
                                    .style('display', 'block')
                                    .transition()
                                    .duration(1000)
                                    .style('opacity', 1)
                                    .each('end', function () {
                                        objCircleNode.remove();
                                        objLabelNode.remove()

                                    })
                            });
                        objLabelNode
                            .transition()
                            .duration(1000)
                            .attr('x', clickedNodeOrigX)
                            .attr('y', clickedNodeOrigY);
                    });
                // crossG
                //     .append('circle')
                //     .attr('cx', 0)
                //     .attr('cy', 0)
                //     .attr('r', 10);
                var crossSize = 6;
                crossG
                    .append('circle')
                    .attr('cx', 0)
                    .attr('cy', 0)
                    .attr('r', crossSize * 1.5)
                    .style('cursor', 'pointer')
                    .style('fill', 'none')
                    .style('pointer-events', 'all')
                    .style('stroke', 'none');
                crossG
                    .append('line')
                    .attr('x1', -crossSize)
                    .attr('y1', -crossSize)
                    .attr('x2', crossSize)
                    .attr('y2', crossSize);
                crossG
                    .append('line')
                    .attr('x1', -crossSize)
                    .attr('y1', crossSize)
                    .attr('x2', crossSize)
                    .attr('y2', -crossSize);
            });

        subject2objectData(data);
    }

    var circles = bubbles
        .append('circle')
        .attr('cx', (width / 2))
        .attr('cy', (width / 2))
        .attr('r', 0)
        .style('opacity', '0')
        .on('mouseover', showSharedHoverTooltip)
        .on('mouseout', function () {
            sharedHoverTooltip.close();
        })
        .on('click', function (d) {
            sharedHoverTooltip.close();
            clickedNode.call(this, d);
        });

    function getText(d, r) {
        if (d) {
            var maxLength = r / 4;
            if (d.length > maxLength) {
                return d.substring(0, maxLength - 3) + '...';
            }
            return d;
        }
        return '';
    }
    // labels
    bubbles
        .append('text')
        .attr('x', function (d) {
            return d.x;
        })
        .attr('y', function (d) {
            return d.y;
        })
        .style('opacity', 0)
        .text(function (d) {
            return getText(d.object, d.r);
        });


    // move the bubbles to their place
    circles.transition()
        .duration(1000)
        .delay(function(d,i) {
            return i * 100;
        })
        .attr('cx', function (d) {
            return d.x;
        })
        .attr('cy', function (d) {
            return d.y;
        })
        .attr('r', function (d) {
            return d.r;
        })
        .style('opacity', 1)
        .each('end', function (d) {
            var siblings = this.parentNode.childNodes;
            siblings.forEach(function (node) {
                if (node.nodeName === 'text') {
                    d3.select(node)
                        .transition()
                        .duration(1000)
                        .style('opacity', 1);
                }
            });
        })
}


function getTreeData(gene, data, entitiesType) {
    var tree = {};
    tree.name = gene;
    tree.children = [];
    for (var i=0; i<data.length; i++) {
        var d = data[i];
        tree.children.push({
            name: d.object.label,
            id: d.id,
            value: d.value,
            entities_type: entitiesType,
            shared_count: d.counts.shared_count,
            union_count: d.counts.union_count,
            shared: (entitiesType === 'target' ? d.shared_diseases : d.shared_targets),
            subject: d.subject.label,
            object: d.object.label,
            subject_counts: (entitiesType === 'target' ? d.subject.links.diseases_count : d.subject.links.targets_count),
            object_counts: (entitiesType === 'target' ? d.object.links.diseases_count : d.object.links.targets_count),
            object_id: d.object.id,
            subject_id: d.subject.id
        });
    }
    return tree;
}
