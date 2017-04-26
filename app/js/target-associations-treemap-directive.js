/* Bubbles directive for associations */
angular.module('cttvDirectives')

    .directive('cttvTargetAssociationsTreemap', ['$log', 'cttvAPIservice', 'cttvUtils', 'cttvConsts', '$analytics', function ($log, cttvAPIservice, cttvUtils, cttvConsts, $analytics) {
        'use strict';

        var whoiam = "treemap";
        var bottomMargin = 220;
        var bView;
        var offset = 300;

        var colorScale = cttvUtils.colorScales.BLUE_0_1; //blue orig

        /*
        function decorateSVG (from_svg) {
            var clone = from_svg.cloneNode(true);
            // Remove the defs and the therapeutic area labels
            d3.select(clone)
                .select("defs")
                .remove();
            d3.select(clone)
                .selectAll(".topLabel")
                .remove();

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
        */
        var config = {
            therapeuticAreas: []
        };

        function filterOutTAs (data) {
            var onlyThisTAs;
            if (config.therapeuticAreas && config.therapeuticAreas.length) {
                onlyThisTAs = {};
                for (var e=0; e<config.therapeuticAreas.length; e++) {
                    onlyThisTAs[config.therapeuticAreas[e].toUpperCase()] = true;
                }
            } else {
                return;
            }

            var newTAs = [];

            for (var i=0; i<data.children.length; i++) {
                var tA = data.children[i];
                // If the Therapeutic Area is not in the list of therapeutic areas we want to display, remove it from the data
                if (onlyThisTAs && (!onlyThisTAs[tA.__id.toUpperCase()])) {
                } else {
                    newTAs.push(tA);
                }
            }

            data.children = newTAs;
        }

        return {
            restrict: 'E',
            require: '?^resize',
            scope: {
                facets : '=',
                target : '@',
                active : '@'
            },

            template: '<div style="float:left">'
            +'<svg width="845" height="522"></svg>' // golden ratio 1.618
            /*+'<form>'
            +'  <label><input type="radio" value="sumBySize" checked ng-click="sumBySize()"> Size</label>'
            +'  <label><input type="radio" value="sumByCount" ng-click="sumByCount()"> Count</label>'
            +'</form>'*/
            +'<cttv-matrix-legend legend-text="legendText" colors="colors" layout="h"></cttv-matrix-legend></div>',
            //+'<png filename="{{target}}-AssociationsBubblesView.png" track="associationsBubbles"></png>',


            link: function (scope, elem, attrs, resizeCtrl) {

                // scope.sumBySize = sumBySize;
                // scope.sumByCount = sumByCount;

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

                    /*var promise = cttvAPIservice.getAssociations(queryObject);

                    if (bView) {
                        bView.therapeuticAreas(opts.therapeutic_area);
                        bView.update(promise);
                    } else {
                        setView();
                        bView.data(promise);
                        bView.therapeuticAreas(opts.therapeutic_area);
                        bView(bubblesContainer);
                    }*/

                    // set this to enable filtering out of therapeutic areas
                    config.therapeuticAreas = opts.therapeutic_area;

                    cttvAPIservice.getAssociations(queryObject)
                    .then(
                        function(resp){
                            $log.log(resp);
                            var data = cttvApi().utils.flat2tree(resp.body);
                            //filterOutTAs(data);
                            onData(data);
                        },
                        cttvAPIservice.defaultErrorHandler
                    );
                });



                var s = elem.children().eq(0).children().eq(0)[0];

                var svg = d3.select( s ),
                    width = +svg.attr("width"),
                    height = +svg.attr("height");

                var fader = function(color) { return d3.interpolateRgb(color, "#fff")(0.2); },
                    color = d3.scaleOrdinal(d3.schemeCategory20.map(fader)),
                    format = d3.format(",d");

                var treemap = d3.treemap()
                    .tile(d3.treemapResquarify)
                    .size([width, height])
                    .round(true)
                    .paddingInner(1)
                    .paddingOuter(1);



                /*
                 * data handler
                 */
                var onData = function(data){

                    var root = d3.hierarchy(data)
                        .eachBefore(function(d) { d.data.id = ((d.parent && d.parent.data.id!="cttv_disease") ? d.parent.data.id + " > " : "") + d.data.name; })
                        .sum(function(d) { return d.children ? 0 : d.__association_score; })
                        .sort(function(a, b) { return b.height - a.height || b.value - a.value; });


                    // add layout information to the data
                    treemap(root);



                    // TODO
                    // actually we'll see how to do this so we can animate transitions
                    // but for now this will do...
                    svg.selectAll("*").remove();



                    //
                    // add the leaf cells
                    //
                    /*var cell = svg.selectAll("g")
                        .data(root.leaves())

                    .enter().append("g")
                        .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
                        .attr("class", "treemap-disease");

                    cell.append("rect")
                        .attr("width", function(d) { return d.x1 - d.x0; })
                        .attr("height", function(d) { return d.y1 - d.y0; })
                        .attr("fill", function(d) { return colorScale(d.data.__association_score); })
                        .on("click", function(d) { console.log(d) })
                        ;

                    // Text labels
                    cell.append("text")
                        .text(function(d) { return d.data.name; })
                        .attr("x", 4)
                        .attr("y", function(d) { return d.y1 - d.y0 - 6; })
                        .attr("fill", function(d){ return d.data.__association_score>0.5 ? "#FFF" : "#000"} )
                        .attr("fill-opacity", 0.8)
                        .attr("font-size", "12px")
                        .attr("visibility", function(d){return (this.getComputedTextLength()<(d.x1 - d.x0 - 10)) ? "visible" : "hidden"  })
                        ;

                    cell.append("title")
                        .text(function(d) { return d.data.id });



                    //
                    // add the therapeutic area headings
                    //
                    $log.log("********");
                    $log.log(root.children);

                    var ta = svg.selectAll("ta")
                        .data(root.children)
                        .enter().append("g")
                        .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
                        .attr("class", "treemap-ta");

                    // clipping path for labels
                    ta.append("clipPath")
                        .attr("id", function(d) { return "clip-" + d.data.__id; })
                        //.append("use")
                        //.attr("xlink:href", function(d) { return "#" + d.data.id; })
                        .append("rect")
                        .attr("x", 4)
                        .attr("y", 4)
                        .attr("width", function(d) { return d.x1 - d.x0 -8; })
                        .attr("height", function(d) { return d.y1 - d.y0 -8; });

                    // TA's rectangle
                    var c = ta.append("rect")
                        // .attr("id", function(d) { return d.data.id; })
                        .attr("width", function(d) { return d.x1 - d.x0 -2; })
                        .attr("height", function(d) { return d.y1 - d.y0 -2; })
                        .attr("x", 1)
                        .attr("y", 1)
                        .attr("fill", function(d) { return colorScale(d.data.__association_score); })
                        .attr("fill-opacity", 0.7)
                        .on("click", function(d) { console.log(d) })
                        ;

                    var taLabel = ta.append("text")
                        .text(function(d) { return d.data.name; })
                        .attr("x", 4)
                        .attr("y", 16)
                        .attr("fill", function(d) { return d.data.__association_score > 0.5 ? "#fff" : "#000"} )
                        //.attr("visibility", function(d){return (this.getComputedTextLength()<(d.x1 - d.x0)) ? "visible" : "hidden"  })
                        .attr("clip-path", function(d) { return "url(#clip-" + d.data.__id + ")"; })
                        ;

                    var taLabelInfo = ta.append("text")
                        .attr("font-size", "12px")
                        .attr("fill", function(d) { return d.data.__association_score > 0.5 ? "#fff" : "#000"} )
                        .attr("fill-opacity", 0.7)
                        //.attr("visibility", function(d){return (this.getComputedTextLength()<(d.x1 - d.x0)) ? "visible" : "hidden"  })
                        .attr("clip-path", function(d) { return "url(#clip-" + d.data.__id + ")"; })
                        ;

                    taLabelInfo.append("tspan")
                        .attr("x", 4)
                        .attr("dy", 32)
                        .text( function(d){return "Association score: "+d.data.__association_score.toFixed(2)} )

                    taLabelInfo.append("tspan")
                        .attr("x", 4)
                        .attr("dy", 12)
                        .text( function(d){return "Diseases: " + d.children.length } )

                    */




                    var cell = svg.selectAll("g")
                        .data(root.children)

                        .enter().append("g")
                        .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
                        .attr("class", "treemap-ta");
                        //.attr("class", function(d){console.log(d); return "bob-treemap-disease"})


                    cell.selectAll("treemap-bob")
                            .data(function(d){ $log.log(d.children); return d.children})
                            .enter()
                            .append("rect")
                            .attr("transform", function(d) { return "translate(" + (d.x0-1) + "," + (d.y0-1) + ")"; })
                            .attr("width", function(d) { return d.x1 - d.x0; })
                             .attr("height", function(d) { return d.y1 - d.y0; })
                            .attr("fill", function(d) { return colorScale(d.data.__association_score); })
                            .attr("fill-opacity", 0.8)
                            .attr("class", "treemap-bob");


                    //
                    cell.append("rect")
                        .attr("width", function(d) { return d.x1 - d.x0 -2; })
                        .attr("height", function(d) { return d.y1 - d.y0 -2; })
                        .attr("x", 1)
                        .attr("y", 1)
                        .attr("fill", function(d) { return colorScale(d.data.__association_score); })
                        .attr("fill-opacity", 0.8)
                        .on("click", function(d) { console.log(d) })
                        ;

                    // Text labels
                    cell.append("text")
                        .text(function(d) { return d.data.name + " ("+d.children.length +")"; })
                        .attr("x", 4)
                        .attr("y", function(d) { return d.y1 - d.y0 - 6; })
                        .attr("fill", function(d){ return d.data.__association_score>0.5 ? "#FFF" : "#000"} )
                        .attr("fill-opacity", 0.8)
                        .attr("font-size", "12px")
                        .attr("visibility", function(d){return (this.getComputedTextLength()<(d.x1 - d.x0 - 10)) ? "visible" : "hidden"  })
                        ;


                    $log.log("root:");
                    $log.log(root);

                    $log.log("ancestors");
                    $log.log(root.ancestors());

                    $log.log("descendants");
                    $log.log(root.descendants());

                    $log.log("leaves");
                    $log.log(root.leaves());








                      /*d3.selectAll("input")
                          .data([sumBySize, sumByCount], function(d) { return d ? d.name : this.value; })
                          .on("change", changed);*/

                      /*var timeout = d3.timeout(function() {
                        d3.select("input[value=\"sumByCount\"]")
                            .property("checked", true)
                            .dispatch("change");
                      }, 2000);

                    scope.changed = function(sum) {
                        timeout.stop();

                        treemap(root.sum(sum));

                        cell.transition()
                            .duration(750)
                            .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
                          .select("rect")
                            .attr("width", function(d) { return d.x1 - d.x0; })
                            .attr("height", function(d) { return d.y1 - d.y0; });
                      }*/


                }

                /*
                var legendDiv = elem.children().eq(0).children().eq(0)[0];
                var bubblesContainer = document.createElement("div");
                bubblesContainer.id="cttvBubblesView";
                scope.element = "cttvBubblesView";
                elem.children().eq(0)[0].insertBefore(bubblesContainer, legendDiv);

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
                */
            }
        };
    }]);
