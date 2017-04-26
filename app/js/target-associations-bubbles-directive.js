/* Bubbles directive for associations */
angular.module('cttvDirectives')

    .directive('cttvTargetAssociationsBubbles', ['$log', 'cttvAPIservice', 'cttvUtils', 'cttvConsts', '$analytics', function ($log, cttvAPIservice, cttvUtils, cttvConsts, $analytics) {
        'use strict';

        var whoiam = "bubbles";
        var bottomMargin = 220;
        var bView;
        var offset = 300;

        function decorateSVG (from_svg) {
            var clone = from_svg.cloneNode(true);
            // Remove the defs and the therapeutic area labels
            d3.select(clone)
                .select("defs")
                .remove();
            d3.select(clone)
                .selectAll(".topLabel")
                .remove();

            // Move the bubbles view to the right to leave space for the new TA labels
            // var currWidth = d3.select(clone).attr("width");
            // d3.select(clone).attr("width", ~~currWidth + offset);
            // d3.select(clone).select("g").attr("transform", "translate(" + offset + ",0)");

            // Get all therapeutic area labels on a side
            var g = d3.select(clone).select("g");
            var root = d3.select(".bubblesViewRoot")
                .datum();

            function okOverlaps(p, angle, others) {
                for (var o in others) {
                    // Overlap
                    if ((Math.abs(others[o].y - p.y)<10) && (Math.abs(angle - others[o].angle)<0.2)) {
                        return false;
                    }
                }
                return true;
            }

            function getPos (init, angle) {
                var p = {};
                p.x = init.x + (init.r * Math.cos(angle));
                p.y = init.y + (init.r * Math.sin(angle));
                return p;
            }
            var labelPositions = {};
            var taBubbles = d3.selectAll(".bubblesViewInternal")
                .each(function (d, i) {
                    // i=0 is the root circle
                    if (!i) {
                        return;
                    }
                    // Calculate angle
                    var angleRadians = Math.atan2(d.y - root.y, d.x - root.x);

                    //angleRadians = angleRadians < 0 ? angleRadians + 360 : angleRadians;
                    // Find the projection of the line in the root bubble
                    var ok = false;
                    var p1 = getPos(d, angleRadians);
                    var p2;
                    var ntries = 0;
                    while (!ok && ntries<50) {
                        ntries++;
                        p2 = getPos(root, angleRadians);
                        ok = okOverlaps(p2, angleRadians, labelPositions);
                        // ok = true;
                        if (!ok) {
                            if ((angleRadians > 0) && (angleRadians < 90)) {
                                angleRadians = angleRadians - 0.02;
                            } else if ((angleRadians > 90) && (angleRadians < 180)) {
                                angleRadians = angleRadians + 0.02;
                            } else if ((angleRadians < 0) && (angleRadians > -90)) {
                                angleRadians = angleRadians + 0.02;
                            } else {
                                angleRadians = angleRadians - 0.02;
                            }
                            //angleRadians = angleRadians + 0.02;
                        }
                    }
                    labelPositions[d.__id] = {
                        x: p2.x,
                        y: p2.y,
                        angle : angleRadians
                    };
                    //var p = getPos(d, angleRadians);
                    // var x1 = d.x + (d.r * Math.cos(angleRadians));
                    // var y1 = d.y + (d.r * Math.sin(angleRadians));
                    // var x2 = root.x + (root.r * Math.cos(angleRadians));
                    // var y2 = root.y + (root.r * Math.sin(angleRadians));

                    g
                        .append("line")
                        .attr("class", "TA-label")
                        .attr("x1", p1.x)
                        .attr("y1", p1.y)
                        .attr("x2", p2.x)
                        .attr("y2", p2.y)
                        .attr("stroke", "gray");
                    g
                        .append("g")
                        .attr("transform", "translate(" + p2.x + "," + p2.y + ")")
                        .append("text")
                        .style("font-size", "12px")
                        .style("text-anchor", function () {
                            var angle = (angleRadians * 180 / Math.PI);
                            if ((angle < -90) || (angle>90)) {
                                return "end";
                            }
                            return "start";
                        })
                        .text(function() {
                            return d.name;
                        });
                });

            // Resize the whole div
            var longestLabel = "";
            taBubbles
                .each(function (d) {
                    if (d.name.length > longestLabel.length) {
                        longestLabel = d.name;
                    }
                });
            var l = longestLabel.length * 6;
            var currWidth = ~~d3.select(clone).attr("width");
            var currHeight = ~~d3.select(clone).attr("height");
            d3.select(clone)
                .attr("width", currWidth + l*2)
                .attr("height", currHeight + 50);
            g.attr("transform", "translate(" + l + "," + "25)");

            return clone;
        }

        return {
            restrict: 'E',
            require: '?^resize',
            scope: {
                // nocancers: '@',
                facets : '=',
                target : '@',
                active : '@'
            },

            template: '<div style="float:left">'
            +'<cttv-matrix-legend legend-text="legendText" colors="colors" layout="h"></cttv-matrix-legend></div>'
            +'<png filename="{{target}}-AssociationsBubblesView.png" track="associationsBubbles"></png>',


            link: function (scope, elem, attrs, resizeCtrl) {
                //var bubblesContainer = elem.children().eq(1).children().eq(0)[0];
                var legendDiv = elem.children().eq(0).children().eq(0)[0];
                var bubblesContainer = document.createElement("div");
                bubblesContainer.id="cttvBubblesView";
                scope.element = "cttvBubblesView";
                elem.children().eq(0)[0].insertBefore(bubblesContainer, legendDiv);
                // bubblesContainer.id = "cttvBubblesView";
                // scope.element = "cttvBubblesView";

                var bView;
                var nav;

                // Change of dims
                scope.$watch(function () {if (resizeCtrl) {return resizeCtrl.dims();}}, function (val) {
                    if (bView) {
                        bView.diameter(val.height - bottomMargin);
                    }
                }, true);

                // Change of target or facets
                scope.$watchGroup(["target", "facets", "active"], function (vals) {
                    var target = vals[0];
                    var facets = vals[1];
                    var act = vals[2];

                    if (scope.active !== whoiam) {
                        return;
                    }
                    var opts = {
                        target: target,
                        outputstructure: "flat",
                        size: 1000,
                        direct: true,
                        facets: false
                    };
                    opts = cttvAPIservice.addFacetsOptions(facets, opts);
                    var queryObject = {
                        method: 'GET',
                        params: opts
                    };

                    var promise = cttvAPIservice.getAssociations(queryObject);
                    // if (scope.nocancers === "true") {
                    //     promise = promise
                    //         .then(function (resp) {
                    //             for (var i = 0; i < resp.body.data.length; i++) {
                    //                 var dis = resp.body.data[i].disease;
                    //                 for (var j = 0; j < dis.efo_info.therapeutic_area.labels.length; j++) {
                    //                     var ta = dis.efo_info.therapeutic_area.labels[j];
                    //                     if (ta === 'neoplasm') {
                    //                         var newCodes = [];
                    //                         var newLabels = [];
                    //                         var newPaths = [];
                    //
                    //                         // This disease has neoplasm
                    //                         // If there are more therapeutic areas, so we need to:
                    //                         // 1.- Remove any other TA from codes
                    //                         // 2.- Remove any other TA from labels
                    //                         // 3.- Remove any path leading to any TA that is not neoplasm
                    //                         // var neoplasmCode = dis.efo_info.therapeutic_area.codes[j];
                    //                         var neoplasmCode = "EFO_0000616";
                    //                         newCodes = [neoplasmCode];
                    //                         newLabels = ["neoplasm"];
                    //                         newPaths = [];
                    //                         for (var k = 0; k < dis.efo_info.path.length; k++) {
                    //                             var path = dis.efo_info.path[k];
                    //                             if (path[0] === neoplasmCode) {
                    //                                 newPaths.push(path);
                    //                             }
                    //                         }
                    //                         dis.efo_info.path = newPaths;
                    //                         dis.efo_info.therapeutic_area = {
                    //                             'codes': newCodes,
                    //                             'labels': newLabels
                    //                         };
                    //                         break;
                    //                     }
                    //                 }
                    //             }
                    //             return resp;
                    //         });
                    //
                    // }

                    if (bView) {
                        bView.therapeuticAreas(opts.therapeutic_area);
                        bView.update(promise);
                    } else {
                        setView();
                        bView.data(promise);
                        bView.therapeuticAreas(opts.therapeutic_area);
                        bView(bubblesContainer);
                    }
                });

                function setView (data) { // data is a promise
                    // Fire a target associations tree event for piwik to track
                    $analytics.eventTrack('targetAssociationsBubbles', {"category": "association", "label": "bubbles"});

                    var viewportW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
                    var viewportH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

                    // Element Coord
        		    var elemOffsetTop = elem[0].parentNode.offsetTop;

                    var diameter = viewportH - elemOffsetTop - bottomMargin;

                    var colorScale = cttvUtils.colorScales.BLUE_0_1; //blue orig

                    bView = targetAssociations()
                        // .target("ENSG00000157764")
                        .target(scope.target)
                        .diameter(diameter)
                        .linkPrefix("")
                        .showAll(true)
                        .colors(cttvUtils.colorScales.BLUE_0_1.range())
                        // .colors(['#e7e1ef', '#dd1c77'])
                        .useFullPath(cttvUtils.browser.name !== "IE")
                        .tooltipsOnTA(true)
                        .showMenu(false);


                    // Setting up legend
                    scope.legendText = "Score";
                    scope.colors = [];
                    for(var i=0; i<=100; i+=25){
                        var j=i/100;
                        //scope.labs.push(j);
                        scope.colors.push( {color:colorScale(j), label:j} );
                    }
                    scope.legendData = [
                        //{label:"Therapeutic Area", class:"no-data"}
                    ];

                }

                if (cttvUtils.browser.name !== "IE") {
                    scope.toExport = function () {
                        var svg = decorateSVG(elem.children().eq(0)[0].querySelector("svg"));
                        return svg;
                    };
                }
            }
        };
    }]);
