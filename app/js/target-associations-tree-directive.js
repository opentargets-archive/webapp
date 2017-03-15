/* Directives */
angular.module('cttvDirectives')

    /*
    *
    */
    .directive('cttvTargetAssociationsTree', ['$log', 'cttvAPIservice', 'cttvConsts', 'cttvUtils', '$analytics', function ($log, cttvAPIservice, cttvConsts, cttvUtils, $analytics) {
        'use strict';

        var whoiam = 'tree';
        var colorScale = cttvUtils.colorScales.BLUE_0_1; //blue orig

        var gat;
        //var currTarget;

        return {

            restrict: 'E',

            scope: {
                nocancers : '@',
                facets : '=',
                target : '@',
                active : '@'
            },

            template: '<png filename="{{target}}-AssociationsTreeView.png" track="associationsTree"></png><div style="float:left"><div id=cttvTreeView></div>'
            +'<cttv-matrix-legend legend-text="legendText" colors="colors" layout="h"></cttv-matrix-legend></div>',


            link: function (scope, elem, attrs) {
                // $log.log("tree.link()");

                var currTarget;
                // legend stuff
                scope.legendText = "Score";
                scope.colors = [];
                for(var i=0; i<=100; i+=25){
                    var j=i/100;
                    scope.colors.push( {color:colorScale(j), label:j} );
                }


                scope.$watchGroup(['target', 'facets', 'active', 'nocancers'], function (vals, old_vals) {
                    // $log.log("tree.watchGroup()");
                    var target = vals[0];
                    var facets = vals[1];
                    var act = vals[2];

                    // $log.log(scope.active +" !== " +whoiam);

                    if ( scope.active !== whoiam ) {
                        return;
                    }

                    // $log.log(target +"!=="+ currTarget);

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
                    var queryObject = {
                        method: 'GET',
                        params: opts
                    };
                    // $log.log(gat);
                    if (!gat) {
                        setTreeView(opts.therapeutic_area);
                    } else {
                        cttvAPIservice.getAssociations (queryObject)
                            .then (function (resp) {
                                // var data = resp.body.data;

                                if (scope.nocancers === "true") {
                                    excludeCancersFromOtherTAs(resp); // side effects on the resp
                                }

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

                var excludeCancersFromOtherTAs = function (resp) {
                    // Exclude the cancers from other therapeutic areas if needed
                    for (var i = 0; i < resp.body.data.length; i++) {
                        var dis = resp.body.data[i].disease;
                        for (var j = 0; j < dis.efo_info.therapeutic_area.labels.length; j++) {
                            var ta = dis.efo_info.therapeutic_area.labels[j];
                            if (ta === 'neoplasm') {
                                var newCodes = [];
                                var newLabels = [];
                                var newPaths = [];

                                // This disease has neoplasm
                                // If there are more therapeutic areas, so we need to:
                                // 1.- Remove any other TA from codes
                                // 2.- Remove any other TA from labels
                                // 3.- Remove any path leading to any TA that is not neoplasm
                                // var neoplasmCode = dis.efo_info.therapeutic_area.codes[j];
                                var neoplasmCode = "EFO_0000616";
                                newCodes = [neoplasmCode];
                                newLabels = ["neoplasm"];
                                newPaths = [];
                                for (var k = 0; k < dis.efo_info.path.length; k++) {
                                    var path = dis.efo_info.path[k];
                                    if (path[0] === neoplasmCode) {
                                        newPaths.push(path);
                                    }
                                }
                                dis.efo_info.path = newPaths;
                                dis.efo_info.therapeutic_area = {
                                    'codes': newCodes,
                                    'labels': newLabels
                                };
                                break;
                            }
                        }
                    }
                };
                
                var setTreeView = function (tas) {
                    // Fire a target associations tree event for piwik to track
                    $analytics.eventTrack('targetAssociationsTree', {"category": "association", "label": "tree"});

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
                    var queryObject = {
                        method: 'GET',
                        params: opts
                    };

                    cttvAPIservice.getAssociations (queryObject)
                        .then (
                            function (resp) {

                                if (scope.nocancers === "true") {
                                    excludeCancersFromOtherTAs(resp); // side effect on resp
                                }

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
                                    .colors(colorScale.range())
                                    .hasLegendScale(false);

                                // gat(fView, elem.children().eq(1)[0]);
                                gat(fView, elem.children().eq(1).children().eq(0)[0]);

                            },
                            cttvAPIservice.defaultErrorHandler
                        );
                };

                if (cttvUtils.browser.name !== "IE") {

                    scope.toExport = function () {
                        var svg = elem.children().eq(1)[0].querySelector("svg");
                        return svg;
                    };
                }
            }
        };
    }]);
