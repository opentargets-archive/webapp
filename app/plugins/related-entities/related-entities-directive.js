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
            }
        }
    }]);

angular.module('otDirectives')
    .directive('otRelatedDiseasesOverview', ['otApi', function (otApi) {
        'use strict';

        return {
            restrict: 'E',
            template: '<div></div>',
            scope: {
                width: '=',
                related: '=',
                disease: '='
            },
            link: function (scope, element) {
                scope.entities = 'diseases';
                scope.otherEntities = 'targets';
                scope.entitySymbol = scope.disease.label;

                var id = scope.disease.efo;
                var opts = {
                    id: id
                };
                var queryObject = {
                    method: 'GET',
                    params: opts
                };
                otApi.getDiseaseRelation(queryObject)
                    .then(
                        // success
                        function (resp) {
                            // var container = document.getElementById('ot-relations-plot');
                            var container = element[0];
                            createRelationsTree(container, resp.body.data, scope);
                            // createRelationsTree(container, resp.body.data, (scope.width / 2), scope.disease.label, scope.entities);

                        },

                        // error handler
                        otApi.defaultErrorHandler
                    );
            }
        };
    }]);

angular.module('otDirectives')
    .directive('otTarget2TargetDiseases', ['otUtils', 'otConsts', function (otUtils, otConsts) {
        'use strict';
        var color = '#377bb5';

        return {
            restrict: 'E',
            template: '<div ng-show="target.approved_symbol && related.name">Top diseases associated with {{target.approved_symbol}} and {{related.name}}</div>' +
                      '<div></div>' +
                      '<ot-matrix-legend style="float:right" legend-text="legendText" colors="colors" layout="h"></ot-matrix-legend>',
            scope: {
                target: '=',
                related: '=',
                diseases: '=',
                width: '='
            },
            link: function (scope, el) {
                scope.$watchGroup(['target', 'related', 'diseases'], function() {
                    if (!scope.target || !scope.diseases || !scope.related) {
                        return;
                    }

                    var diseases = scope.diseases.sort(function (a, b) {
                       return (b[scope.target.approved_symbol].score + b[scope.related.name].score) -
                              (a[scope.target.approved_symbol].score + a[scope.related.name].score)
                    });

                    var container = el[0].getElementsByTagName('div')[1];
                    d3.select(container).selectAll('*').remove();

                    var width = scope.width / 2;
                    var topOffset = 30;
                    var height = (diseases.length * 30);
                    var svg = d3.select(container)
                        .append('svg')
                        .attr('width', width)
                        .attr('height', height + topOffset)
                        .append('g')
                        .attr('transform', 'translate(0, ' + topOffset + ')');

                    // Dimensions of the plot...
                    // <- 20% -> <- 5% -> <---- 50% ---> <- 5% -> <- 20% ->
                    var labelPerc = 20;
                    var bracesPerc = 5;
                    var linksPerc = 50;

                    var labelOffset = (labelPerc * width) / 100;
                    var bracesOffset = (bracesPerc * width) / 100;
                    var linksOffset = (linksPerc * width) / 100;

                    // Links are plotted from 25% to 75%
                    var linksG = svg
                        .append('g')
                        .attr('transform', 'translate(' + (labelOffset + bracesOffset + (linksOffset / 2)) + ', 0)');
                    var linkNodes = linksG.selectAll('.linkNode')
                        .data(diseases)
                        .enter()
                        .append('g')
                        .attr('class', 'linkNode')
                        .attr('transform', function (d, i) {
                            // initial positions
                            // return 'translate(0,' + (i * 30) + ')';
                            return 'translate(0,' + (height / 2) + ')';
                        });

                    var colorScale = otUtils.colorScales.BLUE_0_1; // blue orig

                    // actual links
                    // hover tooltip on object / subject links
                    // var linkTooltip;
                    // function showLinkTooltip(t, d, score) {
                    //     var obj = {};
                    //     obj.header = '';
                    //     obj.body = t + ' - ' + d + ' (score: ' + otUtils.floatPrettyPrint(score) + ')';
                    //     linkTooltip = tooltip.plain()
                    //         .width(180)
                    //         .show_closer(false)
                    //         .call(this, obj);
                    // }

                    function processFlowerData (data) {
                        var fd = [];

                        for (var i = 0; i < otConsts.datatypesOrder.length; i++) {
                            var dkey = otConsts.datatypes[otConsts.datatypesOrder[i]];
                            var key = otConsts.datatypesOrder[i];
                            fd.push({
                                // "value": lookDatasource(data, otConsts.datatypes[key]).score,
                                'value': data ? data[dkey] : 0,
                                'label': otConsts.datatypesLabels[key],
                                'active': true
                            });
                        }
                        return fd;
                    }
                    function showAssociationsTooltip(data) {
                        console.log(data);
                        var flowerDataTarget = processFlowerData(data[scope.target.approved_symbol].datatypes);
                        var flowerDataRelated = processFlowerData(data[scope.related.name].datatypes);

                        var div = document.createElement('div');
                        var leftDiv = d3.select(div)
                            .style('width', '80%')
                            .style('margin', 'auto')
                            .append('div')
                            .style('width', '50%')
                            .style('float', 'left');
                        leftDiv.append('h5')
                            .text(scope.target.approved_symbol);
                        var flower1Div = leftDiv
                            .append('a')
                            .attr('href', '/evidence/' + scope.target.ensembl_gene_id + '/' + data.id)
                            .append('div');
                        leftDiv.append('a')
                            .attr('class', 'cttv_flowerLink')
                            .attr('href', '/evidence/' + scope.target.ensembl_gene_id + '/' + data.id)
                            .append('div')
                            .text('View evidence');


                        var rightDiv = d3.select(div)
                            .append('div')
                            .style('margin-left', '50%');
                        rightDiv.append('h5')
                            .text(scope.related.name);
                        var flower2Div = rightDiv.append('div')
                            .append('a')
                            .attr('href', '/evidence/' + scope.related.geneId + '/' + data.id)
                            .append('div');
                        rightDiv.append('a')
                            .attr('class', 'cttv_flowerLink')
                            .attr('href', '/evidence/' + scope.related.geneId + '/' + data.id)
                            .append('div')
                            .text('View evidence');

                        var flower1 = flowerView()
                            .values(flowerDataTarget)
                            .diagonal(140)
                            .fontsize(8);
                        flower1(flower1Div.node());

                        var flower2 = flowerView()
                            .values(flowerDataRelated)
                            .diagonal(140)
                            .fontsize(8);
                        flower2(flower2Div.node());

                        var obj = {};
                        obj.header = 'Associations with ' + data.label;
                        obj.body = div.innerHTML;
                        tooltip.plain()
                            .id('flowersView')
                            .width(300)
                            .call(this, obj);
                    }

                    // subject
                    linkNodes
                        .append('line')
                        .attr('x1', -linksOffset / 2)
                        .attr('x2', 0)
                        .attr('y1', 0)
                        .attr('y2', 0)
                        .style('stroke-width', '2px')
                        .style('stroke', function (d) {
                            return colorScale(d[scope.target.approved_symbol].score);
                        // })
                        // .on('mouseover', function (d) {
                        //     showLinkTooltip.call(this, scope.target.approved_symbol, d.label, d[scope.target.approved_symbol].score)
                        // })
                        // .on('mouseout', function () {
                        //     linkTooltip.close();
                        });

                    // object
                    linkNodes
                        .append('line')
                        .attr('x1', 0)
                        .attr('x2', linksOffset / 2)
                        .attr('y1', 0)
                        .attr('y2', 0)
                        .style('stroke-width', '2px')
                        .style('stroke', function (d) {
                            return colorScale(d[scope.related.name].score);
                        // })
                        // .on('mouseover', function (d) {
                        //     showLinkTooltip.call(this, scope.related.name, d.label, d[scope.related.name].score)
                        // })
                        // .on('mouseout', function () {
                        //     linkTooltip.close();
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
                            return d.label;
                        })
                        .on('click', showAssociationsTooltip);


                    // nodes for links
                    linkNodes
                        .append('circle')
                        .attr('cx', 0)
                        .attr('cy', 0)
                        .attr('r', 5)
                        .attr('fill', color)
                        .style('cursor', 'pointer')
                        .on('click', showAssociationsTooltip);

                    var linksTransition = linkNodes
                        .transition()
                        .duration(1000)
                        .delay(function (d, i) {
                            return i*100;
                        })
                        .attr('transform', function (d, i) {
                            return 'translate(0,' + (i * 30) + ')';
                        });
                    linksTransition.select('text')
                        .style('opacity', 1);


                    // braces1
                    var braces1 = svg
                        .append('g')
                        .attr('transform', 'translate(' + (labelOffset) + ',0)');
                    braces1.selectAll('.braces1')
                        .data(diseases)
                        .enter()
                        .append('path')
                        .attr('d', function (d, i) {
                            // return 'M0,' + (height / 2) + ' C' + (bracesOffset) + ',' + (height / 2) + ' 0,' + ((i * 30)) + ' ' + (bracesOffset) + ',' + ((i * 30));
                            return 'M0,' + (height / 2) + ' C' + (bracesOffset) + ',' + (height / 2) + ' 0,' + (height / 2) + ' ' + (bracesOffset) + ',' + (height / 2);
                        })
                        .attr('fill', 'none')
                        .style('stroke-width', '2px')
                        .attr('stroke', function (d) {
                            return colorScale(d[scope.target.approved_symbol].score);
                        });
                    braces1
                        .selectAll('path')
                        .transition()
                        .duration(1000)
                        .delay(function (d, i) {
                            return i*100;
                        })
                        .attr('d', function (d, i) {
                            return 'M0,' + (height / 2) + ' C' + (bracesOffset) + ',' + (height / 2) + ' 0,' + ((i * 30)) + ' ' + (bracesOffset) + ',' + ((i * 30));
                        });

                    // braces2
                    var braces2 = svg
                        .append('g')
                        .attr('transform', 'translate(' + (labelOffset + (bracesOffset*2) + linksOffset) + ',0)');
                    braces2.selectAll('.braces2')
                        .data(diseases)
                        .enter()
                        .append('path')
                        .attr('d', function (d, i) {
                            // return 'M0,' + (height / 2) + ' C' + (-bracesOffset) + ',' + (height / 2) + ' 0,' + ((i * 30)) + ' ' + (-bracesOffset) + ',' + ((i * 30));
                            return 'M0,' + (height / 2) + ' C' + (-bracesOffset) + ',' + (height / 2) + ' 0,' + (height / 2) + ' ' + (-bracesOffset) + ',' + (height / 2);
                        })
                        .attr('fill', 'none')
                        .style('stroke-width', '2px')
                        .attr('stroke', function (d) {
                            return colorScale(d[scope.related.name].score);
                        });
                    braces2
                        .selectAll('path')
                        .transition()
                        .duration(1000)
                        .delay(function (d, i) {
                           return i*100;
                        })
                        .attr('d', function (d, i) {
                            return 'M0,' + (height / 2) + ' C' + (-bracesOffset) + ',' + (height / 2) + ' 0,' + ((i * 30)) + ' ' + (-bracesOffset) + ',' + ((i * 30));
                        });

                    // Entity nodes
                    var ent1G = svg
                        .append('g')
                        .attr('transform', 'translate(' + (labelOffset - 5) + ',' + (height / 2) + ')');
                    ent1G
                        .append('circle')
                        .attr('cx', 0)
                        .attr('cy', 0)
                        .attr('r', 5)
                        .attr('fill', color);
                    ent1G
                        .append('text')
                        .attr('x', -5)
                        .attr('y', 0)
                        .attr('text-anchor', 'end')
                        .attr('alignment-baseline', 'middle')
                        .attr('fill', '#666666')
                        .text(scope.target.approved_symbol);

                    var ent2G = svg
                        .append('g')
                        .attr('transform', 'translate(' + (labelOffset + (bracesOffset*2) + linksOffset + 5) + ',' + (height / 2) + ')');
                    ent2G
                        .append('circle')
                        .attr('cx', 0)
                        .attr('cy', 0)
                        .attr('r', 5)
                        .attr('fill', color);
                    ent2G
                        .append('text')
                        .attr('x', 5)
                        .attr('y', 0)
                        .attr('text-anchor', 'start')
                        .attr('alignment-baseline', 'middle')
                        .attr('fill', '#666666')
                        .text(scope.related.name);

                    scope.diseases = undefined;

                    // legend
                    scope.legendText = 'Score';
                    scope.colors = [];
                    for (var i = 0; i <= 100; i += 25) {
                        var j = i / 100;
                        // scope.labs.push(j);
                        scope.colors.push({color: colorScale(j), label: j});
                    }
                    scope.legendData = [
                        // {label:"Therapeutic Area", class:"no-data"}
                    ];

                })
            }
        };
    }]);

angular.module('otDirectives')
    .directive('otRelatedEntityDetails', ['otApi', '$q', function (otApi, $q) {
        'use strict';

        return {
            restrict: 'E',
            template: '<ot-target-2-target-diseases target="target" related="related" diseases="diseases" width="width"></ot-target-2-target-diseases>',
            scope: {
                target: '=',
                related: '=',
                width: '='
            },
            link: function (scope) {
                scope.$watch('related', function () {
                    if (scope.related) {

                        // Get the best 10 diseases for target1 and any of the shared diseases...
                        var optsTarget = {
                            target: [scope.target.ensembl_gene_id],
                            disease: scope.related.shared,
                            size: 10
                        };
                        var queryObjectTarget = {
                            method: 'POST',
                            trackCall: false,
                            params: optsTarget
                        };

                        // Same for target 2
                        var optsRelated = {
                            target: [scope.related.geneId],
                            disease: scope.related.shared,
                            size: 10
                        };
                        var queryObjectRelated = {
                            method: 'POST',
                            trackCall: false,
                            params: optsRelated
                        };

                        var targetPromise = otApi.getAssociations(queryObjectTarget);
                        var relatedPromise = otApi.getAssociations(queryObjectRelated);
                        $q.all([targetPromise, relatedPromise])
                            .then(function (resps) {
                                var diseases = {};
                                var missingDiseases = {};
                                missingDiseases[scope.target.ensembl_gene_id] = {};
                                missingDiseases[scope.related.geneId] = {};

                                resps[0].body.data.map(function (d) {
                                    var disLabel = d.disease.efo_info.label;
                                    diseases[disLabel] = {
                                        id: d.disease.id,
                                        label: d.disease.efo_info.label
                                    };
                                    diseases[disLabel][d.target.gene_info.symbol] = {
                                        id: d.target.id,
                                        label: d.target.gene_info.symbol,
                                        score: d.association_score.overall,
                                        datatypes: d.association_score.datatypes
                                    };
                                    // record this disease as a possible missing disease for the related gene
                                    missingDiseases[scope.related.geneId][d.disease.id] = true;
                                    diseases[disLabel][scope.related.name] = {
                                        id: scope.related.geneId,
                                        label: scope.related.name,
                                        // score is set to 0 here and to the real score in the next map
                                        score: 0
                                    };
                                });

                                resps[1].body.data.map(function (d) {
                                    var disLabel = d.disease.efo_info.label;
                                    if (diseases[disLabel]) {
                                        delete missingDiseases[scope.related.geneId][d.disease.id];
                                        diseases[disLabel][scope.related.name].score = d.association_score.overall;
                                        diseases[disLabel][scope.related.name].datatypes = d.association_score.datatypes;
                                    } else {
                                        missingDiseases[scope.target.ensembl_gene_id][d.disease.id] = true;
                                        diseases[disLabel] = {
                                            id: d.disease.id,
                                            label: d.disease.efo_info.label
                                        };
                                        diseases[disLabel][d.target.gene_info.symbol] = {
                                            id: d.target.id,
                                            label: d.target.gene_info.symbol,
                                            score: d.association_score.overall,
                                            datatypes: d.association_score.datatypes
                                        };
                                        diseases[disLabel][scope.target.approved_symbol] = {
                                            id: scope.target.ensembl_gene_id,
                                            label: scope.target.approved_symbol,
                                            score: 0
                                        };
                                    }
                                    // return d.disease.efo_info.label;
                                });

                                // Search for the missing diseases in both targets...
                                // create mock promises in case we don't have missing diseases for any of them
                                var missingTargetPromise = $q(function (resolve) {
                                   return {
                                       body: {
                                           data: []
                                       }
                                   };
                                });
                                var missingRelatedPromise = $q(function (resolve) {
                                    return {
                                        body: {
                                            data: []
                                        }
                                    };
                                });
                                if (Object.keys(missingDiseases[scope.target.ensembl_gene_id])) {
                                    var optsMissingTarget = {
                                        target: [scope.target.ensembl_gene_id],
                                        disease: Object.keys(missingDiseases[scope.target.ensembl_gene_id])
                                    };
                                    var queryObjectMissingTarget = {
                                        method: 'POST',
                                        trackCall: false,
                                        params: optsMissingTarget
                                    };
                                    missingTargetPromise = otApi.getAssociations(queryObjectMissingTarget);
                                }

                                if (Object.keys(missingDiseases[scope.related.geneId])) {
                                    var optsMissingRelated = {
                                        target: [scope.related.geneId],
                                        disease: Object.keys(missingDiseases[scope.related.geneId])
                                    };
                                    var queryObjectMissingRelated = {
                                        method: 'POST',
                                        trackCall: false,
                                        params: optsMissingRelated
                                    };
                                    missingRelatedPromise = otApi.getAssociations(queryObjectMissingRelated);
                                }

                                $q.all([missingTargetPromise, missingRelatedPromise])
                                    .then (function (resps) {
                                        resps[0].body.data.map(function (d) {
                                            var disLabel = d.disease.efo_info.label;
                                            diseases[disLabel][d.target.gene_info.symbol].score = d.association_score.overall
                                            diseases[disLabel][d.target.gene_info.symbol].datatypes = d.association_score.datatypes
                                        });
                                        resps[1].body.data.map(function (d) {
                                            var disLabel = d.disease.efo_info.label;
                                            diseases[disLabel][d.target.gene_info.symbol].score = d.association_score.overall
                                            diseases[disLabel][d.target.gene_info.symbol].datatypes = d.association_score.datatypes
                                        });

                                        // convert diseases from object to array
                                        var diseasesArr = [];
                                        for (var disease in diseases) {
                                            if (diseases.hasOwnProperty(disease)) {
                                                diseasesArr.push(diseases[disease]);
                                            }
                                        }

                                        scope.diseases = diseasesArr;
                                    });

                            });
                    }
                });
                // scope.$watch('target', function () {
                //     console.log('new target object!!!');
                //     console.log(scope.target);
                // });
            }
        };
    }]);

angular.module('otDirectives')
    .directive('otRelatedTargetsOverview', ['otApi', function (otApi) {
        'use strict';

        return {
            restrict: 'E',
            // templateUrl: 'plugins/related-entities/related-entities.html',
            // template: '<ot-best-related-targets target="target" related="related" width="width">' +
            //           '</ot-best-related-targets>',
            template: '<div></div>',
            scope: {
                target: '=',
                related: '=',
                width: '='
            },
            link: function (scope, element) {
                scope.entities = 'targets';
                scope.otherEntities = 'diseases';
                scope.entitySymbol = scope.target.symbol;

                var id = scope.target.id;
                var opts = {
                    id: id
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
                            createRelationsTree(container, resp.body.data, scope);
                            // createRelationsTree(container, resp.body.data, (scope.width / 2), scope.target.approved_symbol, scope.entities);
                        },

                        // error handler
                        otApi.defaultErrorHandler
                    );
            }
        };
    }]);

function createRelationsTree(container, data, scope) {
    var width = scope.width / 2;
    var gene = scope.entitySymbol;
    var entitiesType = scope.entities;

    var treeData = getTreeData(gene, data, entitiesType);
    var color = '#377bb5';

    // Widths
    // var treeWidth = (width/2) - 10;
    var treeWidth = (width / 2) - 40;
    var boardWidth = (width / 2) - 40;

    // Tree
    var tree = tnt.tree()
        .data(treeData)
        .branch_color('#aaaaaa')
        .layout(tnt.tree.layout.vertical()
            .width(treeWidth)
            .scale(false)
        )
        .node_display (tnt.tree.node_display.circle()
            .size(5)
            .fill(color)
        )
        .label (tnt.tree.label.text()
            .height(40)
            .fontsize(function () {
                return 10;
            })
            .text (function (node) {
                var name = node.property('name') || '';
                if (name.length > 30) {
                    name = name.substring(0, 27) + '...';
                }
                return name;
                // return node.property("name");
            })
        );

    // Board
    var diseasesExtent = d3.extent(data, function (d) {
       return d.counts.shared_count;
    });

    var board = tnt.board()
        .width(boardWidth)
        .from(0)
        .to(diseasesExtent[1])
        .allow_drag(false);

    // hover tooltip on track bars
    var barHoverTooltip;
    function showBarHoverTooltip(data) {
        var obj = {};
        obj.header = '';
        obj.body = data.val + ' ' + (entitiesType === 'targets' ? 'diseases' : 'targets') + ' shared between ' + gene + ' and ' + data.name + '<br />Click to get details';
        barHoverTooltip = tooltip.plain()
            .width(180)
            .show_closer(false)
            .call(this, obj)
    }

    var sharedDiseasesHoverTooltip;
    function showSharedDiseasesHoverTooltip(data) {

        var obj = {};
        // obj.header = data.shared_count + ' ' + (entitiesType === 'targets' ? 'diseases' : 'targets') + ' shared between ' + gene + ' and ' + data.name;
        obj.header = '';

        var div = document.createElement('div');
        d3.select(div)
            .append('text')
            .style('font-size', '0.9em')
            .style('display', 'block')
            .text(data.object + ' - ' + data.object_counts + ' associations');
        d3.select(div)
            .append('text')
            .style('font-size', '0.9em')
            .style('display', 'block')
            .text(data.subject + ' - ' + data.subject_counts + ' associations');
        d3.select(div)
            .append('text')
            .style('font-size', '0.9em')
            .style('display', 'block')
            .text('Intersection - ' + data.shared_count + ' associations');
        d3.select(div)
            .append('text')
            .style('font-size', '0.9em')
            .style('display', 'block')
            .text('Union - ' + data.union_count + ' associations');

        var container = d3.select(div)
            .append('div');

        var sets = [
            {sets: [data.subject], size: data.subject_counts},
            {sets: [data.object], size: data.object_counts},
            {sets: [data.subject, data.object], size: data.shared_count}
        ];

        var chart = venn.VennDiagram()
            .width(120)
            .height(120);
        container.datum(sets).call(chart);
        obj.body = div.innerHTML;
        sharedDiseasesHoverTooltip = tooltip.plain()
            .width(180)
            .show_closer(false)
            .call(this, obj)
    }


    var track = function (leaf) {
        var data = leaf.data();
        return tnt.board.track()
            .color('white')
            .data(tnt.board.track.data.sync()
                .retriever (function () {
                    return [{
                        id: data.id,
                        val: data.shared_count,
                        name: data.name,
                        geneId: data.geneId,
                        shared: data.shared
                    }];
                })
            )
            // .display(tnt.board.track.feature.block()
            .display(barFeature()
                .color(color)
                .index(function(d) {
                    return d.id;
                })
                .on('mouseover', showBarHoverTooltip)
                .on('mouseout', function () {
                    barHoverTooltip.close();
                })
                .on('click', function (data) {
                    // showRelationDetails(data, gene, entitiesType)
                    scope.related = data;
                    scope.$apply();
                })
            );
    };

    var vis = tnt()
        .tree(tree)
        .board(board)
        .track(track)
        .ruler('top');

    vis(container);

    // Add extra label on the left of each node with the number of common diseases
    if (treeWidth >= 250) {
        // The tree svg. We assume is the first svg in the container:
        var treeSvg = d3.select(container).select('svg');
        treeSvg.selectAll('.leaf')
            .each(function (d) {
                d3.select(this)
                    .append('text')
                    .attr('x', (- 10))
                    .attr('y', 0)
                    .attr('dy', '-0.3em')
                    .style('fill', '#666666')
                    .attr('text-anchor', 'end')
                    .style('font-size', '0.8em')
                    .style('font-weight', 200)
                    .style('cursor', 'pointer')
                    .text(d.shared_count + ' ' + (entitiesType === 'targets' ? 'diseases' : 'targets') + ' shared')
                    .on('mouseover', function (d) {
                        showSharedDiseasesHoverTooltip.call(this, d);
                        d3.select(this)
                            .style('font-weight', 'normal')
                            .style('fill', 'black');
                    })
                    .on('mouseout', function (d) {
                        sharedDiseasesHoverTooltip.close();
                        d3.select(this)
                            .style('font-weight', 200)
                            .style('fill', '#666666');
                    })
                    .on('click', function (data) {
                        scope.related = data.shared;
                        scope.$apply();
                    });
            });

    }
}

// function showRelationDetails(data, gene, entitiesType) {
//     var detailsContainer = d3.select('#ot-relation-details');
//     detailsContainer.selectAll('*').remove();
//     detailsContainer
//         .append('h3')
//         .text(gene + ' - ' + data.name + ' shared ' + (entitiesType === 'targets' ? 'diseases' : 'targets'));
//     detailsContainer
//         .append('p')
//         .text('For now, the first 10 shared ' + (entitiesType === 'targets' ? 'diseases' : 'targets') + ' are shown');
//     var ul = detailsContainer
//         .append('ul');
//     ul.selectAll('li')
//         .data(data.shared.slice(0, 10))
//         .enter()
//         .append('li')
//         .style('font-size', '0.8em')
//         .text(function (d) {
//             return d;
//         })
// }

function getTreeData(gene, data, entitiesType) {
    var tree = {};
    tree.name = gene;
    tree.children = [];
    for (var i=0; i<data.length; i++) {
        var d = data[i];
        tree.children.push({
            name: d.object.label,
            id: d.id,
            geneId: d.object.id,
            value: d.value,
            shared_count: d.counts.shared_count,
            union_count: d.counts.union_count,
            shared: (entitiesType === 'targets' ? d.shared_diseases : d.shared_targets),
            subject: d.subject.label,
            object: d.object.label,
            subject_counts: (entitiesType === 'targets' ? d.subject.links.diseases_count : d.subject.links.targets_count),
            object_counts: (entitiesType === 'targets' ? d.object.links.diseases_count : d.object.links.targets_count)
        })
    }
    return tree;
}

function barFeature () {
    // 'Inherit' from board.track.feature
    var feature = tnt.board.track.feature();
    feature
        .create(function (el) {
            var xScale = feature.scale();
            var track = this;
            var y = track.height();
            var yOffset = (y / 4);

            const g = el
                .append('g')
                .append('rect')
                .attr('x', 0)
                .attr('y', yOffset)
                .attr('width', 0)
                // .attr('width', function (d) {
                //     return (xScale(d.val));
                // })
                .attr('height', y - (2 * yOffset))
                // .attr('fill', track.color())
                .attr('fill', feature.color())
                .transition()
                .duration(1000)
                .attr('width', function (d) {
                    return xScale(d.val);
                });
                // .attr("fill", function (d) {
                //     return feature.color();
                // });
        });
    return feature;
}

// Unused for now
// function createRelationsCircle(container, data, width) {
//     // Distribution of sizes in the plot:
//     // 1. Node circle (central node): diameter = 1/5
//     // 2. Links circle: diamter 2/5
//     // 3. Names circle: diamter 2/5
//     var w = width - (width / 5);
//     var r = w / 2;
//     var centralNodeRadius = r / 5;
//     var linksRadius = (r * (2 / 5)) + centralNodeRadius;
//     var namesRadius = (r * (2 / 5)) + linksRadius;
//
//     var svg = d3.select(container)
//         .append('svg')
//         .attr('width', w)
//         .attr('height', w)
//         .append('g')
//         .attr('transform', 'translate(' + (w/2) + ',' + (w/2) + ')');
//
//     // names circle
//     var namesCircle = svg
//         .append('circle')
//         .attr('cx', 0)
//         .attr('cy', 0)
//         .attr('r', namesRadius)
//         .style('stroke-width', '1px')
//         .style('stroke', 'black')
//         .style('fill', 'none');
//
//     // links circle
//     var linksCircle = svg
//         .append('circle')
//         .attr('cx', 0)
//         .attr('cy', 0)
//         .attr('r', linksRadius)
//         .style('stroke-width', '1px')
//         .style('stroke', 'black')
//         .style('fill', 'none');
//
//     // central node
//     var centralNode = svg
//         .append('g')
//     centralNode
//         .append('circle')
//         .attr('r', 30)
//         .attr('cx', 0)
//         .attr('cy', 0)
//         .attr('color', color);
// }
