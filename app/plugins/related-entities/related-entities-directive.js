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
    .directive('otSubject2Object', ['otUtils', 'otConsts', function (otUtils, otConsts) {
        'use strict';
        var color = '#377bb5';

        return {
            restrict: 'E',
            template: '<div>Top diseases associated with blah, blah and blah, blah</div>' +
                      '<div></div>' +
                      '<ot-matrix-legend style="float:right" legend-text="legendText" colors="colors" layout="h"></ot-matrix-legend>',
            scope: {
                subject: '=',
                object: '=',
                shared: '=',
                entity: '=',
                width: '='
            },
            link: function (scope, el) {
                scope.$watchGroup(['subject', 'object', 'shared'], function() {
                    if (!scope.subject || !scope.object || !scope.shared) {
                        return;
                    }

                    console.log(scope.subject);
                    console.log(scope.object);
                    console.log(scope.shared);

                    var shared = scope.shared.sort(function (a, b) {
                        if (scope.entity === 'target') {
                            return (b[scope.subject.approved_symbol].score + b[scope.object.name].score) -
                                (a[scope.subject.approved_symbol].score + a[scope.object.name].score);
                        } else {
                            return (b[scope.subject.label].score + b[scope.object.label].score) -
                                (a[scope.subject.label].score + a[scope.object.label].score)

                        }
                    });

                    var container = el[0].getElementsByTagName('div')[1];
                    d3.select(container).selectAll('*').remove();

                    var width = scope.width / 2;
                    var topOffset = 30;
                    var height = (shared.length * 30);
                    var svg = d3.select(container)
                        .append('svg')
                        .attr('width', width)
                        .attr('height', height + topOffset)
                        .append('g')
                        .attr('transform', 'translate(0, ' + topOffset + ')');

                    var subjSymbol = scope.entity === 'target' ? scope.subject.approved_symbol : scope.subject.label; // ???
                    var subjId = scope.entity === 'target' ? scope.subject.ensembl_gene_id : scope.subject.efo; // ???
                    var objSymbol = scope.entity === 'target' ? scope.object.name : scope.object.label; // ???
                    var objId = scope.entity === 'target' ? scope.object.geneId : scope.object.efo; // ???


                    // Dimensions of the plot...
                    // <- 20% -> <- 5% -> <---- 50% ---> <- 5% -> <- 20% ->
                    var labelPerc, bracesPerc, linksPerc;
                    if (scope.entity === 'target') {
                        labelPerc = 20;
                        bracesPerc = 5;
                        linksPerc = 50;
                    } else {
                        labelPerc = 35;
                        bracesPerc = 5;
                        linksPerc = 20;
                    }

                    var labelOffset = (labelPerc * width) / 100;
                    var bracesOffset = (bracesPerc * width) / 100;
                    var linksOffset = (linksPerc * width) / 100;

                    // Links are plotted from 25% to 75%
                    var linksG = svg
                        .append('g')
                        .attr('transform', 'translate(' + (labelOffset + bracesOffset + (linksOffset / 2)) + ', 0)');
                    var linkNodes = linksG.selectAll('.linkNode')
                        .data(shared)
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
                        var flowerDataSubj = processFlowerData(data[subjSymbol].datatypes);
                        var flowerDataObj = processFlowerData(data[objSymbol].datatypes);

                        var div = document.createElement('div');
                        var leftDiv = d3.select(div)
                            .style('width', '80%')
                            .style('margin', 'auto')
                            .append('div')
                            .style('width', '50%')
                            .style('float', 'left');
                        leftDiv.append('h5')
                            .text(subjSymbol);
                        var flower1Div = leftDiv
                            .append('a')
                            .attr('href', '/evidence/' + (scope.entity === 'target' ? subjId : data.id) + '/' + (scope.entity === 'target' ? data.id : subjId))
                            .append('div');
                        leftDiv.append('a')
                            .attr('class', 'cttv_flowerLink')
                            .attr('href', '/evidence/' + (scope.entity === 'target' ? subjId : data.id) + '/' + (scope.entity === 'target' ? data.id : subjId))
                            .append('div')
                            .text('View evidence');


                        var rightDiv = d3.select(div)
                            .append('div')
                            .style('margin-left', '50%');
                        rightDiv.append('h5')
                            .text(objSymbol);
                        var flower2Div = rightDiv.append('div')
                            .append('a')
                            .attr('href', '/evidence/' + (scope.entity === 'target' ? objId : data.id) + '/' + (scope.entity === 'target' ? data.id : objId))
                            .append('div');
                        rightDiv.append('a')
                            .attr('class', 'cttv_flowerLink')
                            .attr('href', '/evidence/' + (scope.entity === 'target' ? objId : data.id) + '/' + (scope.entity === 'target' ? data.id : objId))
                            .append('div')
                            .text('View evidence');

                        var flower1 = flowerView()
                            .values(flowerDataSubj)
                            .diagonal(140)
                            .fontsize(8);
                        flower1(flower1Div.node());

                        var flower2 = flowerView()
                            .values(flowerDataObj)
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
                            return colorScale(d[subjSymbol].score);
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
                            return colorScale(d[objSymbol].score);
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
                        .data(shared)
                        .enter()
                        .append('path')
                        .attr('d', function (d, i) {
                            // return 'M0,' + (height / 2) + ' C' + (bracesOffset) + ',' + (height / 2) + ' 0,' + ((i * 30)) + ' ' + (bracesOffset) + ',' + ((i * 30));
                            return 'M0,' + (height / 2) + ' C' + (bracesOffset) + ',' + (height / 2) + ' 0,' + (height / 2) + ' ' + (bracesOffset) + ',' + (height / 2);
                        })
                        .attr('fill', 'none')
                        .style('stroke-width', '2px')
                        .attr('stroke', function (d) {
                            return colorScale(d[subjSymbol].score);
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
                        .data(shared)
                        .enter()
                        .append('path')
                        .attr('d', function (d, i) {
                            // return 'M0,' + (height / 2) + ' C' + (-bracesOffset) + ',' + (height / 2) + ' 0,' + ((i * 30)) + ' ' + (-bracesOffset) + ',' + ((i * 30));
                            return 'M0,' + (height / 2) + ' C' + (-bracesOffset) + ',' + (height / 2) + ' 0,' + (height / 2) + ' ' + (-bracesOffset) + ',' + (height / 2);
                        })
                        .attr('fill', 'none')
                        .style('stroke-width', '2px')
                        .attr('stroke', function (d) {
                            return colorScale(d[objSymbol].score);
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
                        .text(subjSymbol);

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
                        .text(objSymbol);

                    scope.shared = undefined;

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
            template: '<ot-subject-2-object subject="subject" object="object" shared="shared" entity="entity" width="width"></ot-subject-2-object>',
            scope: {
                subject: '=',
                object: '=',
                width: '=',
                entity: '='
            },
            link: function (scope) {
                scope.$watch('object', function () {
                    if (scope.object) {
                        console.log(scope.entity);
                        console.log(scope.subject);
                        console.log(scope.object);

                        var subjId = (scope.entity === 'target' ? scope.subject.ensembl_gene_id : scope.subject.efo);
                        var objId = (scope.entity === 'target' ? scope.object.geneId : scope.object.efo);
                        var subjSymbol = (scope.entity === 'target' ? scope.subject.approved_symbol : scope.subject.label); // ??
                        var objSymbol = (scope.entity === 'target' ? scope.object.name : scope.object.label); // ??

                        console.log(subjId + ', ' + objId + ', ' + subjSymbol + ', ' + objSymbol);

                        // Get the best 10 diseases|targets for target1|disease1 and any of the shared diseases|targets...
                        var optsSubj;
                        var optsObj;
                        if (scope.entity === 'target') {
                            optsSubj = {
                                target: [subjId],
                                disease: scope.object.shared,
                                size: 10
                            };
                            optsObj = {
                                target: [objId],
                                disease: scope.object.shared,
                                size: 10
                            };
                        } else {
                            optsSubj = {
                                target: scope.object.shared,
                                disease: [scope.subject.efo], // ??
                                size: 10
                            };
                            optsObj = {
                                target: scope.object.shared,
                                disease: [scope.object.efo], // ??
                                size: 10
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


                        var subjPromise = otApi.getAssociations(querySubj);
                        var objPromise = otApi.getAssociations(queryObj);
                        $q.all([subjPromise, objPromise])
                            .then(function (resps) {
                                var shared = {};
                                // var diseases = {};
                                var missingShared = {};
                                // var missingDiseases = {};

                                missingShared[subjId] = {};
                                missingShared[objId] = {};
                                resps[0].body.data.map(function (d) {
                                    var sharedLabel = (scope.entity === 'target' ? d.disease.efo_info.label : d.target.gene_info.symbol);
                                    var sharedId = (scope.entity === 'target' ? d.disease.id : d.target.id);

                                    // var disLabel = d.disease.efo_info.label;
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
                                    // record this disease as a possible missing disease for the object
                                    missingShared[objId][sharedId] = true;
                                    shared[sharedLabel][objSymbol] = {
                                        id: objId,
                                        label: objSymbol,
                                        // score is set to 0 here and to the real score in the next map
                                        score: 0
                                    };
                                });

                                resps[1].body.data.map(function (d) {
                                    var sharedLabel = (scope.entity === 'target' ? d.disease.efo_info.label : d.target.gene_info.symbol);
                                    var sharedId = (scope.entity === 'target' ? d.disease.id : d.target.id);

                                    // check if this shared entity has already been set in the prev map
                                    if (shared[sharedLabel]) {
                                        delete missingShared[objId][sharedId];
                                        shared[sharedLabel][objSymbol].score = d.association_score.overall;
                                        shared[sharedLabel][objSymbol].datatypes = d.association_score.datatypes;
                                    } else {
                                        // If not already in the shared object
                                        missingShared[subjId][sharedId] = true;
                                        shared[sharedLabel] = {
                                            id: sharedId,
                                            label: sharedLabel
                                        };
                                        shared[sharedLabel][objSymbol] = {
                                            id: objId,
                                            label: objSymbol,
                                            score: d.association_score.overall,
                                            datatypes: d.association_score.datatypes
                                        };
                                        shared[sharedLabel][subjSymbol] = {
                                            id: subjId,
                                            label: subjSymbol,
                                            score: 0
                                        };
                                    }
                                    // return d.disease.efo_info.label;
                                });

                                // Search for the missing diseases in both targets...
                                // create mock promises in case we don't have missing diseases for any of them
                                var missingSubjPromise = $q(function (resolve) {
                                   resolve ({
                                       body: {
                                           data: []
                                       }
                                   });
                                });
                                var missingObjPromise = $q(function (resolve) {
                                    resolve ({
                                        body: {
                                            data: []
                                        }
                                    });
                                });
                                if (Object.keys(missingShared[subjId])) {
                                    var optsMissingSubj = {
                                        target: (scope.entity === 'target' ? [subjId] : Object.keys(missingShared[subjId])),
                                        disease: (scope.entity === 'target' ? (Object.keys(missingShared[subjId])) : [subjId])
                                    };
                                    var queryMissingSubj = {
                                        method: 'POST',
                                        trackCall: false,
                                        params: optsMissingSubj
                                    };
                                    missingSubjPromise = otApi.getAssociations(queryMissingSubj);
                                }

                                if (Object.keys(missingShared[objId])) {
                                    var optsMissingObj = {
                                        target: (scope.entity === 'target' ? [objId] : Object.keys(missingShared[objId])),
                                        disease: (scope.entity === 'target' ? Object.keys(missingShared[objId]) : [objId])
                                    };
                                    var queryMissingObj = {
                                        method: 'POST',
                                        trackCall: false,
                                        params: optsMissingObj
                                    };
                                    missingObjPromise = otApi.getAssociations(queryMissingObj);
                                }

                                $q.all([missingSubjPromise, missingObjPromise])
                                    .then (function (resps) {
                                        resps[0].body.data.map(function (d) {
                                            // var disLabel = d.disease.efo_info.label;
                                            var sharedLabel = (scope.entity === 'target' ? d.disease.efo_info.label : d.target.gene_info.symbol);

                                            shared[sharedLabel][subjSymbol].score = d.association_score.overall;
                                            shared[sharedLabel][subjSymbol].datatypes = d.association_score.datatypes;
                                        });
                                        resps[1].body.data.map(function (d) {
                                            // var disLabel = d.disease.efo_info.label;
                                            var sharedLabel = (scope.entity === 'target' ? d.disease.efo_info.label : d.target.gene_info.symbol);
                                            shared[sharedLabel][objSymbol].score = d.association_score.overall;
                                            shared[sharedLabel][objSymbol].datatypes = d.association_score.datatypes
                                        });

                                        // convert diseases from object to array
                                        var sharedArr = [];
                                        for (var shared1 in shared) {
                                            if (shared.hasOwnProperty(shared1)) {
                                                sharedArr.push(shared[shared1]);
                                            }
                                        }

                                        scope.shared = sharedArr;
                                    });

                            });
                    }
                });
            }
        };
    }]);

angular.module('otDirectives')
    .directive('otRelatedTargetsOverview', ['otApi', function (otApi) {
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
                    console.log('scope.entities... ' + scope.entities);
                    if (scope.entities === 'targets') {
                        return [{
                            id: data.id,
                            val: data.shared_count,
                            name: data.name,
                            geneId: data.geneId,
                            shared: data.shared
                        }];
                    } else {
                        return [{
                            id: data.id,
                            val: data.shared_count,
                            label: data.name,
                            efo: data.geneId,
                            shared: data.shared
                        }];
                    }
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
