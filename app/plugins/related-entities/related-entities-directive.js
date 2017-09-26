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
    .directive('otRelatedDiseasesOverview', ['otApi', '$timeout', function (otApi, $timeout) {
        'use strict';

        return {
            restrict: 'E',
            // templateUrl: 'plugins/related-entities/related-entities.html',
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
                $timeout(function () {
                    otApi.getDiseaseRelation(queryObject)
                        .then(
                            // success
                            function (resp) {
                                // var container = document.getElementById('ot-relations-plot');
                                var container = element[0];
                                createRelationsTree(container, resp.body.data, (scope.width / 2), scope.disease.label, scope.entities);
                            },

                            // error handler
                            otApi.defaultErrorHandler
                        );
                }, 0);
            }
        };
    }]);

angular.module('otDirectives')
    .directive('otRelatedTargetDetails', ['otApi', function (otApi) {
        'use strict';

        return {
            restrict: 'E',
            template: '<div>Hello world</div>',
            scope: {
                target: '=',
                related: '=',
                width: '='
            },
            link: function (scope) {
                scope.$watch('related', function () {
                    if (scope.related) {
                        console.log('rendering details for ' + scope.related.name + ' and ' + scope.target.symbol + ' via...');
                        console.log(scope.related.shared);

                        console.log(scope.related);
                        console.log(scope.target);
                        
                        // Get the best 10 diseases for target1 and any of the shared diseases...
                        var opts = {
                            target: [scope.target.ensembl_gene_id],
                            disease: scope.related.shared,
                            size: 10,
                        };
                        var queryObject = {
                            method: 'POST',
                            params: opts
                        };
                        otApi.getAssociations(queryObject)
                            .then (function (resp) {
                                console.log(resp);
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
            .height(30)
            .text (function (node) {
                return node.property("name");
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
        obj.body = data.val + ' ' + (entitiesType === 'targets' ? 'diseases' : 'targets') + ' shared between ' + gene + ' and ' + data.name;
        barHoverTooltip = tooltip.plain()
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
                    console.log(scope);
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
        var leaves = tree.root().get_all_leaves();

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
                        d3.select(this)
                            .style('font-weight', 'normal')
                            .style('fill', 'black');
                    })
                    .on('mouseout', function (d) {
                        d3.select(this)
                            .style('font-weight', 200)
                            .style('fill', '#666666');
                    });
            });

    }
}

function showRelationDetails(data, gene, entitiesType) {
    var detailsContainer = d3.select('#ot-relation-details');
    detailsContainer.selectAll('*').remove();
    detailsContainer
        .append('h3')
        .text(gene + ' - ' + data.name + ' shared ' + (entitiesType === 'targets' ? 'diseases' : 'targets'));
    detailsContainer
        .append('p')
        .text('For now, the first 10 shared ' + (entitiesType === 'targets' ? 'diseases' : 'targets') + ' are shown');
    var ul = detailsContainer
        .append('ul');
    ul.selectAll('li')
        .data(data.shared.slice(0, 10))
        .enter()
        .append('li')
        .style('font-size', '0.8em')
        .text(function (d) {
            return d;
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
            geneId: d.object.id,
            value: d.value,
            shared_count: d.counts.shared_count,
            union_count: d.counts.union_count,
            shared: (entitiesType === 'targets' ? d.shared_diseases : d.shared_targets),
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
            var yOffset = (y / 8);

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
                .duration(2000)
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
function createRelationsCircle(container, data, width) {
    // Distribution of sizes in the plot:
    // 1. Node circle (central node): diameter = 1/5
    // 2. Links circle: diamter 2/5
    // 3. Names circle: diamter 2/5
    var w = width - (width / 5);
    var r = w / 2;
    var centralNodeRadius = r / 5;
    var linksRadius = (r * (2 / 5)) + centralNodeRadius;
    var namesRadius = (r * (2 / 5)) + linksRadius;

    var svg = d3.select(container)
        .append('svg')
        .attr('width', w)
        .attr('height', w)
        .append('g')
        .attr('transform', 'translate(' + (w/2) + ',' + (w/2) + ')');

    // names circle
    var namesCircle = svg
        .append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', namesRadius)
        .style('stroke-width', '1px')
        .style('stroke', 'black')
        .style('fill', 'none');

    // links circle
    var linksCircle = svg
        .append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', linksRadius)
        .style('stroke-width', '1px')
        .style('stroke', 'black')
        .style('fill', 'none');

    // central node
    var centralNode = svg
        .append('g')
    centralNode
        .append('circle')
        .attr('r', 30)
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('color', 'blue');
}