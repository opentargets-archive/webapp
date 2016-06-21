/* Directives */
angular.module('cttvDirectives')

    /*
    *
    */
    .directive('cttvTargetAssociationsTree', ['$log', 'cttvAPIservice', 'cttvConsts', 'cttvUtils', function ($log, cttvAPIservice, cttvConsts, cttvUtils) {
        'use strict';

        var whoiam = 'tree';
        var colorScale = cttvUtils.colorScales.BLUE_0_1; //blue orig

        var gat;
        var currTarget;

        return {

            restrict: 'E',

            scope: {
                facets : '=',
                target : '@',
                active : '@'
            },

            template: '<div></div>'
            +'<cttv-matrix-legend legend-text="legendText" colors="colors" layout="h"></cttv-matrix-legend>',


            link: function (scope, elem, attrs) {
                $log.log("");
                $log.log("");
                $log.log("*** cttvTargetAssociationsTree: link()");

                // legend stuff
                scope.legendText = "Score";
                scope.colors = [];
                for(var i=0; i<=100; i+=25){
                    var j=i/100;
                    scope.colors.push( {color:colorScale(j), label:j} );
                }

                $log.log("*** setting up watchGroup...");

                scope.$watchGroup(['target', 'facets', 'active'], function (vals, old_vals) {
                    // $log.log("");
                    // $log.log("");
                    // $log.log("*** cttvTargetAssociationsTree: watchGroup()");
                    // $log.log( scope.active !== whoiam );
                    // $log.log(vals);
                    // $log.log(old_vals);
                    // $log.log("Check facets js: "+ Object.is(vals[1],old_vals[1]));
                    // $log.log("Check facets _: "+ _.isEqual(vals[1],old_vals[1])  );

                    var target = vals[0];
                    var facets = vals[1];
                    var act = vals[2];

                    if ( scope.active !== whoiam ) {
                    //if ( scope.active !== whoiam || ( !Object.is(vals[1],old_vals[1]) && _.isEqual(vals[1],old_vals[1]) ) ) { // TODO: this is a temporary fix
                        return;
                    }

                    // Remove the current tree if the target has changed
                    if (target !== currTarget) {
                        gat = undefined;
                    }
                    currTarget = target;

                    var opts = {
                        target: scope.target,
                        outputstructure: "false",
                        direct: true,
                        facets: false,
                        size: 1000
                    };
                    opts = cttvAPIservice.addFacetsOptions(facets, opts);

                    if (!gat) {
                        setTreeView(opts.therapeutic_area);
                    } else {
                        cttvAPIservice.getAssociations (opts)
                            .then (function (resp) {
                                // var data = resp.body.data;
                                var data = cttvAPIservice.flat2tree(resp.body);
                                if (data) {
                                    gat
                                        .data(data)
                                        .therapeuticAreas(opts.therapeutic_area)
                                        //.datatypes(dts)
                                        .update();
                                    }
                                },
                                cttvAPIservice.defaultErrorHandler
                            );
                    }

                });

                var setTreeView = function (tas) {

                    $log.log("*** cttvTargetAssociationsTree: setTreeView()");

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
                                // console.warn ("RESP FOR TREE");
                                // console.warn(resp);

                                $log.log("*** cttvTargetAssociationsTree: setTreeView().response");

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
                                    .filters(scope.facets)
                                    .diameter(900)
                                    .legendText("<a xlink:href='/faq#association-score'><text style=\"fill:#3a99d7;cursor:pointer\" alignment-baseline=central>Score</text></a>")
                                    .target(scope.target)
                                    .therapeuticAreas(tas)
                                    .hasLegendScale(false);

                                gat(fView, elem.children().eq(0)[0]);
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
