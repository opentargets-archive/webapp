angular.module('otDirectives')

    .directive('otInteractorsStarPlot', ['$log', '$timeout', 'otOmnipathdbCategories', 'otUtils', function ($log, $timeout, otOmnipathdbCategories, otUtils) {
        'use strict';

        var selectedNodesColors = ['#ffe6e6', '#e6ecff'];
        var maxNodes = 180;

        function getSelectedNode (all, one) {
            for (var i = 0; i < all.length; i++) {
                if (all[i].label === one) {
                    return all[i];
                }
            }
        }

        function takeBestInteractors (interactors, n) {
        // We have more than 200 interactors
        // 'best' is based on the number of connected nodes

        // First store the number of interactors to facilitate sorting
            interactors.map(function (d) {
                d.nInteractors = Object.keys(d.interactsWith).length;
            });

            var interactorsSelected = interactors.sort(function (a, b) {
                return b.nInteractors - a.nInteractors;
            }).slice(0, n);


            // We need to eliminate the discarded nodes also from the interaction objects inside the nodes
            // interactors is now sorted, so we just have to take the slice [n,interactors.length]
            var interactorsDiscarded = interactors.slice(n, interactors.length);
            var discardedIndex = {};
            for (var i = 0; i < interactorsDiscarded.length; i++) {
                discardedIndex[interactorsDiscarded[i].label] = true;
            }
            for (var j = 0; j < interactorsSelected.length; j++) {
                var interactor = interactorsSelected[j];
                for (var interacted in interactor.interactsWith) {
                    if (interactor.interactsWith.hasOwnProperty(interacted)) {
                        if (discardedIndex[interacted]) {
                            delete interactor.interactsWith[interacted];
                        }
                    }
                }
            }


            return interactorsSelected;
        }

        return {
            restrict: 'E',
            templateUrl: 'src/components/multiple-targets/multiple-targets-interactions-summary.html',
            scope: {
                interactors: '=',
                categories: '=',
                selected: '='
            },
            link: function (scope) {
                scope.showSpinner = true;

                // The PNG export routine
                if (otUtils.browser.name !== 'IE') {
                    scope.toExport = function () {
                        var svg = document.getElementById('interactionsViewerMultipleTargets').querySelector('svg');
                        return svg;
                    };
                }

                scope.$watchGroup(['interactors', 'categories'], function () {
                    if (!scope.interactors) {
                        return;
                    }

                    var interactors = scope.interactors;

                    // Set up the interactors viewer
                    var interactorsArr = [];
                    scope.dataRange = [Infinity, 0];
                    for (var inter in interactors) {
                        if (interactors.hasOwnProperty(inter)) {
                        // Leave out nodes without interactions
                            if (Object.keys(interactors[inter].interactsWith).length) {
                                interactorsArr.push(interactors[inter]);
                            }

                            // Calculate data range
                            var il = Object.keys(interactors[inter].interactsWith).length;
                            if (il < scope.dataRange[0]) {
                                scope.dataRange[0] = il;
                            }
                            if (il > scope.dataRange[1]) {
                                scope.dataRange[1] = il;
                            }
                        }
                    }

                    scope.nInteractors = interactorsArr.length;

                    // The star plot is currently limited to 200 nodes.
                    // At this point if we have more than 200 we take the first 200 based on number of connections
                    if (interactorsArr.length > maxNodes) {
                        $log.log(interactorsArr.length + ' interactors found, limiting to ' + maxNodes);
                        interactorsArr = takeBestInteractors(interactorsArr, maxNodes);
                    }


                    // Tooltips
                    var hover_tooltip;

                    function mouseoverTooltip (d) {
                        var obj = {};
                        obj.header = '';
                        obj.body = d.label + ' (' + Object.keys(d.interactsWith).length + ' interactors)';
                        hover_tooltip = tooltip.plain()
                            .width(180)
                            .show_closer(false)
                            .id(2)
                            .call(this, obj);
                    }

                    // Keep track of the types filtering
                    var currentTypesSelection = {};
                    scope.filterInteractionType = function (category) {
                        if (currentTypesSelection[category]) {
                            delete (currentTypesSelection[category]);
                        } else {
                            currentTypesSelection[category] = true;
                        }

                        var leftOutCats = {};
                        $log.log(currentTypesSelection);
                        if (Object.keys(currentTypesSelection).length) {
                            for (var c in scope.categories) {
                                if (scope.categories.hasOwnProperty(c)) {
                                    leftOutCats[c] = true;
                                }
                            }
                            for (var cat in currentTypesSelection) {
                                if (currentTypesSelection.hasOwnProperty(cat)) {
                                    delete (leftOutCats[cat]);
                                }
                            }
                        }
                        filterCategories(Object.keys(leftOutCats));
                    };

                    function filterCategories (cats) {
                        scope.filterOut = {};

                        // The filter can be in a category, so convert to individual sources
                        for (var i = 0; i < cats.length; i++) {
                            var cat = cats[i];
                            var sourcesForCategory = otOmnipathdbCategories[cat];
                            if (sourcesForCategory) {
                                for (var s in sourcesForCategory) {
                                    scope.filterOut[s] = true;
                                }
                            }
                        }

                        iv.filters(scope.filterOut);
                        iv.update();
                    }


                    scope.selectedNodes = [];
                    scope.unselectNode = function (node) {
                        iv.click(node, false); // If the click should fire a "select"/"unselect" event
                        for (var i = 0; i < scope.selectedNodes.length; i++) {
                            if (scope.selectedNodes[i].label === node.label) {
                                scope.selectedNodes.splice(i, 1);
                            }
                        }
                    };

                    // Color scale for the nodes (using the BLUE_0_1 range)
                    var range = otUtils.colorScales.BLUE_0_1.range(); // blue orig
                    var newColorScale = d3.scale.linear()
                        .domain([0, 1])
                        .range(range); // blue orig


                    // At this point we hide the spinner and show the star plot
                    var iv = interactionsViewer()
                        .data(interactorsArr.sort(function (a, b) {
                        // Sort interactors alphabetically
                            if (a.label < b.label) { return -1; }
                            if (a.label > b.label) { return 1; }
                            return 0;
                        }))
                        .selectedNodesColors(selectedNodesColors)
                        .size(600)
                        .colorScale(newColorScale)
                        .labelSize(90)
                        .on('mouseout', function () {
                            hover_tooltip.close();
                        })
                        .on('mouseover', mouseoverTooltip)
                        .on('select', function (selectedNode) {
                            scope.selectedNodes.push(selectedNode);
                            scope.$apply();
                        })
                        .on('unselect', function (unselectedNode) {
                            for (var i = 0; i < scope.selectedNodes.length; i++) {
                                if (scope.selectedNodes[i].label === unselectedNode.label) {
                                    scope.selectedNodes.splice(i, 1);
                                }
                            }
                            scope.$apply();
                        })
                        .on('interaction', function (interactors) {
                            var obj = {};
                            // obj.header = iNames.join(" - ") + " interactions";
                            obj.header = interactors.interactor1 + ' - ' + interactors.interactor2 + ' interaction';
                            obj.rows = [];

                            // Differenciate between sources
                            var pathways = [];
                            var ppis = [];
                            var enzSubs = [];
                            interactors.provenance.forEach(function (p) {
                                if (p.category === 'Pathways') {
                                    pathways.push(p);
                                } else if (p.category === 'PPI') {
                                    ppis.push(p);
                                } else if (p.category === 'Enzyme-substrate') {
                                    enzSubs.push(p);
                                }
                            });

                            scope.pathways = pathways;
                            scope.ppis = ppis;
                            scope.enzSubs = enzSubs;
                            scope.$apply();
                        })
                        .on('loaded', function () {
                        // If the "selected" attribute is passed, we select the node programmatically...
                        // We need to wait until the star has been loaded in the screen
                            if (scope.selected) {
                                var selectedNode = getSelectedNode(interactorsArr, scope.selected);
                                iv.click(selectedNode);
                            }
                        });
                    $timeout(function () {
                        scope.showSpinner = false;
                        iv(document.getElementById('interactionsViewerMultipleTargets'));
                    }, 0);

                    // Setting up legend
                    // scope.legendText = "Number of interactors";
                    scope.colors = [];
                    for (var i = 0; i <= 100; i += 25) {
                        var j = i / 100;
                        // scope.labs.push(j);
                        scope.colors.push({color: newColorScale(j), label: j});
                    }
                });
            }
        };
    }]);
