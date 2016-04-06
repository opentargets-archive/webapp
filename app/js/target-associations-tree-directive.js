/* Directives */
angular.module('cttvDirectives')

    /*
    *
    */
    .directive('cttvTargetAssociationsTree', ['$log', 'cttvAPIservice', 'cttvConsts', function ($log, cttvAPIservice, cttvConsts) {
        'use strict';

        var whoiam = 'tree';

        var gat;
        return {
            restrict: 'E',
            scope: {
                facets : '=',
                target : '@',
                active : '@'
            },
            link: function (scope, elem, attrs) {

                scope.$watchGroup(['target', 'facets', 'active'], function (vals) {
                    var target = vals[0];
                    var facets = vals[1];
                    var act = vals[2];
                    if (scope.active !== whoiam) {
                        return;
                    }

                    var opts = {
                        target: scope.target,
                        outputstructure: "false",
                        direct: true,
                        facets: false,
                        size: 1000
                    };
                    opts = cttvAPIservice.addFacetsOptions(facets, opts);

                    if (!gat) {
                        setTreeView();
                    } else {
                        cttvAPIservice.getAssociations (opts)
                            .then (function (resp) {
                                // var data = resp.body.data;
                                var data = cttvAPIservice.flat2tree(resp.body);
                                if (data) {
                                    gat
                                        .data(data)
                                        //.datatypes(dts)
                                        .filters(facets)
                                        .update();
                                    }
                                },
                                cttvAPIservice.defaultErrorHandler
                            );
                    }

                });

                // scope.$watch( 'facets', function (fct) {
                //     //var dts = JSON.parse(attrs.datatypes);
                //     if (datatypesChangesCounter>0) {
                //         if (!gat) {
                //             setTreeView();
                //             return;
                //         }
                //         // var opts = {
                //         //     target: attrs.target,
                //         //     datastructure: "tree",
                //         // };
                //         // if (!_.isEmpty(dts)) {
                //         //     opts.filterbydatatype = _.keys(dts);
                //         // }
                //
                //         var opts = {
                //             target: attrs.target,
                //             outputstructure: "false",
                //             direct: true,
                //             facets: false,
                //             size: 1000
                //         };
                //         opts = cttvAPIservice.addFacetsOptions(fct, opts);
                //
                //         cttvAPIservice.getAssociations (opts)
                //             .then (function (resp) {
                //                 // var data = resp.body.data;
                //                 var data = cttvAPIservice.flat2tree(resp.body);
                //                 if (data) {
                //                     gat
                //                         .data(data)
                //                         //.datatypes(dts)
                //                         .filters(fct)
                //                         .update();
                //                     }
                //                 },
                //                 cttvAPIservice.defaultErrorHandler
                //             );
                //     }
                //     datatypesChangesCounter++;
                // });

                var setTreeView = function () {
                    ////// Tree view
                    // viewport Size
                    var viewportW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
                    var viewportH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

                    // Element Coord
                    var elemOffsetTop = elem[0].parentNode.offsetTop;

                    // BottomMargin
                    var bottomMargin = 50;

                    // TODO: This is not being used at the moment. We are fixing the size of the tree to 900px (see below)
                    var diameter = viewportH - elemOffsetTop - bottomMargin;
                    $log.log("DIAMETER FOR TREE: " + diameter);

                    //var dts = JSON.parse(attrs.datatypes);
                    // var opts = {
                    //     target: attrs.target,
                    //     datastructure: "tree"
                    // };
                    // if (!_.isEmpty(dts)) {
                    //     opts.filterbydatatype = _.keys(dts);
                    // }

                    var opts = {
                        target: scope.target,
                        outputstructure: "flat",
                        direct: true,
                        facets: false,
                        size: 1000
                    };
                    opts = cttvAPIservice.addFacetsOptions(scope.facets, opts);

                    cttvAPIservice.getAssociations (opts)
                        .then (
                            function (resp) {
                                console.warn ("RESP FOR TREE");
                                console.warn(resp);

                                var data = cttvAPIservice.flat2tree(resp.body);
                                // var data = resp.body.data;
                                if (_.isEmpty(data)) {
                                    return;
                                }
                                var fView = flowerView()
                                .fontsize(9)
                                .diagonal(100);

                                gat = geneAssociationsTree()
                                    .data(data)
                                    //.datatypes(dts)
                                    .names(cttvConsts)
                                    .diameter(900)
                                    .legendText("<a xlink:href='/faq#association-score'><text style=\"fill:#3a99d7;cursor:pointer\" alignment-baseline=central>Score</text></a>")
                                    .target(scope.target)
                                    .filters (scope.facets);
                                gat(fView, elem[0]);
                            },
                            cttvAPIservice.defaultErrorHandler
                        );
                };

                // scope.$watch(function () { return attrs.target; }, function (val) {
                //     setTreeView();
                // });

                // scope.$watch(function () { return attrs.focus; }, function (val) {
                //     if (val === "None") {
                //         return;
                //     }
                //
                //     if (gat) {
                //         gat.selectTherapeuticArea(val);
                //     }
                // });
            }
        };
    }]);
