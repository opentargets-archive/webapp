/* Bubbles directive for associations */
angular.module('cttvDirectives')

    .directive('cttvTargetAssociationsTreemap', ['$log', 'cttvAPIservice', 'cttvUtils', 'cttvConsts', '$analytics', '$location', function ($log, cttvAPIservice, cttvUtils, cttvConsts, $analytics, $location) {
        'use strict';

        var whoiam = "treemap";
        //var bottomMargin = 220;
        var bView;
        //var offset = 300;
        var ratio = 2;

        var colorScale = cttvUtils.colorScales.BLUE_0_1; //blue orig

        var margin = {top: 30, right: 0, bottom: 0, left: 0},
            height = 522,   // the height of the actual treemap (i.e. not including the navigation at top)
            width = 845,
            transitioning;

        var x = d3.scaleLinear()
            .domain([0, width])
            .range([0, width]);

        var y = d3.scaleLinear()
            .domain([0, height])
            .range([0, height]);

        var fader = function(color) { return d3.interpolateRgb(color, "#fff")(0.2); },
            color = d3.scaleOrdinal(d3.schemeCategory20.map(fader)),
            format = d3.format(",d");




        var config = {
            therapeuticAreas: []
        };


        // keeps only the selected TAs
        // since the API will return *all* TA's containing diseases from teh selected TA
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

            +'<svg></svg>'
            +'<cttv-matrix-legend legend-text="legendText" colors="colors" layout="h"></cttv-matrix-legend></div>',
            //+'<png filename="{{target}}-AssociationsBubblesView.png" track="associationsBubbles"></png>',


            link: function (scope, elem, attrs, resizeCtrl) {

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


                    // set this to enable filtering out of therapeutic areas
                    config.therapeuticAreas = opts.therapeutic_area;

                    cttvAPIservice.getAssociations(queryObject)
                    .then(
                        function(resp){
                            $log.log(resp);
                            var data = cttvApi().utils.flat2tree(resp.body);
                            // if the root data only has one child, we process that directly,
                            // so effectively is like 'zooming' into that selected TA
                            filterOutTAs(data);
                            onData( (data.children && data.children.length==1) ? data.children[0] : data );
                            // onData(data);
                        },
                        cttvAPIservice.defaultErrorHandler
                    );
                });


                // setup the SVG
                var s = elem.children().eq(0).children().eq(0)[0];

                var svg = d3.select( s )
                    .attr("width", width)
                    .attr("height", (height + margin.top))
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                    .style("shape-rendering", "crispEdges");

                var nav = svg.append("g")
                    .attr("class", "tm-nav");

                    nav.append("rect")
                        .attr("x", 0)
                        .attr("y", -margin.top)
                        .attr("width", width)
                        .attr("height", margin.top)
                        //.style("fill", "#336699");

                    nav.append("text")
                        .attr("x", 6)
                        .attr("y", 9 - margin.top)
                        .attr("dy", ".75em")
                        .text("");

                var chart = svg.append("g")
                    .attr("class", "tm-chart")
                    .attr("width", width)
                    .attr("height", height);


                var treemap = d3.treemap()
                    //.tile(d3.treemapSquarify)
                    .tile(d3.treemapSquarify.ratio(1))
                    .size([width/ratio, height])
                    //.round(true)
                    //.paddingOuter(1);
                    ;



                function navigate(d){
                    $location.path("/evidence/" + scope.target + "/" + d.data.__id);
                    scope.$apply(); // or the location.path doesn't take effect...
                }



                /*
                 * data handler
                 */
                var onData = function(data){
                    $log.log("data");
                    $log.log(data);

                    // ----------------
                    // approach 4 : zoomable thingy, still inside data handler...
                    // ----------------


                    var r = d3.hierarchy(data)
                            .eachBefore(function(d) { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name; })
                            //.sum(function(d){ return d.children ? 0 : d.__association_score; })
                            .sum(function(d){ return d.__association_score; });

                    updateNodeValue(r);
                    r.sort(function(a, b) { return b.height - a.height || b.value - a.value; });
                    treemap(r);

                    function updateNodeValue(n){

                        // cts = children total score;
                        // this is the sum of score of the direct children of the node (i.e. only one level down)
                        if(n.children){
                            n.cts = n.children.reduce(function(a,v){return a+v.data.__association_score;}, 0);
                        }else{
                            n.cts = n.data.__association_score;
                        }

                        // is this the first one?
                        if(n.depth==0){
                            n.value = n.cts;
                        } else {
                            n.value = (n.data.__association_score*n.parent.value) / n.parent.cts
                        }

                        // repeat for children
                        if(n.children){
                            n.children.forEach(function(ni){
                                updateNodeValue(ni);
                            })
                        }

                    }


                    display(r);


                    function display(d) {

                        // navigation
                        nav
                            .datum(d.parent)
                            .on("click", transition)
                            .classed("tm-nav-hidden", name(d).length==0 )
                            .select("text")
                            .text(name(d));


                        // actual treemap
                        var g1 = chart.append("g")
                            .datum(d.children)

                        var cell = g1.selectAll("g")
                            .data(d.children)
                            .enter().append("g");

                        // add click to cells with children
                        cell.filter(function(d) { return d.children; })
                            .classed("children", true)
                            .on("click", transition);

                        // define a clippath to cut text
                        cell.append("clipPath")
                            .attr("id", function(d) { return "clip-" + d.data.__id; })
                            //.append("use")
                            //.attr("xlink:href", function(d) { return "#clip-" + d.data.__id; })
                            .append("rect")
                            .attr("class", "clippath")
                            .call(path)
                            ;

                        // draw the children, if any
                        cell.selectAll(".child")
                            .data( function(d) { return d.children || [d]; } )
                            .enter()
                            .append("rect")
                                .attr("class", "cell child")
                                .call(rect)
                                .on("click", navigate)
                                //.attr("a href", "google.com")
                                // add color?? ... awww... don't be ridiculous!
                                //.attr("fill", function(d) { return colorScale(d.data.__association_score); })
                                .append("title")
                                    .text(function(d) { return name(d); });

                        // add a parent rectangle
                        cell.append("rect")
                            .attr("class", "cell parent")
                            .call(rect)
                            // add color??
                            //.attr("fill", function(d) { return colorScale(d.data.__association_score); })
                            .append("title")
                                .text(function(d) { return name(d); });

                        // Text
                        // we want to differentiate between therapeutic areas (i.e. those with children)
                        // and diseases (i.e. leaves)... just to complicate things a little
                        var cellLabel = cell.append("text")
                                .text(function(d) { return d.data.name; })
                                .attr("class", function(d){ return d.children ? "ta-label" : "disease-label"  })
                                .attr("clip-path", function(d) { return "url(#clip-" + d.data.__id + ")"; });

                            cellLabel.append("tspan")
                                .attr("class", "ta-label-details")
                                .text( function(d){return "Association score: "+d.data.__association_score.toFixed(2)} )
                            ;

                            cellLabel.filter(function(d) { return d.children; })
                                .append("tspan")
                                .attr("class", "ta-label-details")
                                .text( function(d){return "Diseases: " + d.children.length } )
                            ;


                            cellLabel.call(text)
                            cellLabel.append("title")
                                .text(function(d) { return name(d); });


                        function transition(d) {

                            if (transitioning || !d) return;
                            transitioning = true;

                            var g2 = display(d);
                            var t1 = g1.transition().duration(750);     // the old stuff to move out
                            var t2 = g2.transition().duration(750);     // the new stuff coming in


                            // Update the domain only after entering new elements.
                            x.domain([d.x0 * ratio, d.x1 * ratio]);
                            y.domain([d.y0, d.y1]);

                            // Enable anti-aliasing during the transition
                            svg.style("shape-rendering", null);

                            // Draw child nodes on top of parent nodes
                            svg.selectAll(".tm-chart").nodes().sort(
                                function(a, b) {
                                    return a.depth - b.depth;
                                });

                            // Fade-in entering text.
                            g2.selectAll("text").style("fill-opacity", 0);

                            // Transition to the new view:
                            // text
                            t1.selectAll("text").call(text).style("fill-opacity", 0);
                            t2.selectAll("text").call(text).style("fill-opacity", 1);
                            // rectangles
                            t1.selectAll(".cell").call(rect);
                            t2.selectAll(".cell").call(rect);
                            // clippaths (yup, these also have to be scaled, although probably no need for animation)
                            t1.selectAll(".clippath").call(path);
                            t2.selectAll(".clippath").call(path);


                            // Remove the old node when the transition is finished.
                            t1.remove().on("end", function(){
                                console.log("t1 done");
                                svg.style("shape-rendering", "crispEdges");
                                transitioning = false;
                            });
                        }



                        return cell;


                    } // end display



                    function text(text) {
                        // set position and visibility based on cell size (so after each transition)
                        text
                            .attr("dy", ".75em")
                            .attr("x", function(d) { return x(d.x0 * ratio) + 6; })
                            .attr("y", function(d) { return y(d.y0) + 6; })
                            .style("visibility", function(d){
                                var cw = x(d.x1 * ratio) - x(d.x0 * ratio);
                                var ch = y(d.y1) - y(d.y0);
                                return (ch>=24 && cw>=30) ? "visible" : "hidden";
                            })

                            .selectAll(".ta-label-details")
                                .attr("x", function(d,i) { return x(d.x0 * ratio) + 6; })
                                .attr("y", function(d,i) { return y(d.y0) + (i*12 + 32); })
                            ;
                    }


                    function rect(rect) {
                        rect.attr("x", function(d) { return x(d.x0 * ratio); })
                            .attr("y", function(d) { return y(d.y0); })
                            .attr("width", function(d) { return x(d.x1 * ratio) - x(d.x0 * ratio); })
                            .attr("height", function(d) { return y(d.y1) - y(d.y0); });
                    }


                    function name(d) {
                        return d
                                .ancestors()
                                .reverse()
                                .map(function(i){return i.data.name})
                                .slice(1)
                                .join(" > ");
                    }


                    function path(path){
                        path.attr("x", function(d) { return x(d.x0 * ratio)+4; })
                            .attr("y", function(d) { return y(d.y0)+4; })
                            .attr("width", function(d) { return Math.max( 0, (x(d.x1 * ratio) - x(d.x0 * ratio) - 8) ) ; })
                            .attr("height", function(d) { return Math.max( 0, (y(d.y1) - y(d.y0) - 8) ) ; });
                    }


                } // end onData()


            }
        };
    }]);
