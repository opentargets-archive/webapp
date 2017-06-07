angular.module('plugins')
    .directive('bibliographyTargetTreemap', ['$log', '$http', 'cttvUtils', '$timeout', function ($log, $http, cttvUtils, $timeout) {
        'use strict';

        var t0;
        var ratio = 2;

        var colorScale = cttvUtils.colorScales.BLUE_0_1; //blue orig

        var margin = {top: 30, right: 0, bottom: 0, left: 0},
            //height = 522,   // the height of the actual treemap (i.e. not including the navigation at top)
            height = 250,
            width = 938,
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

        var s,
            svg,
            nav,
            chart,
            biblio,
            treemap,
            selected,
            g1,
            g2
            ;

        /*
            {"query":{"query_string":{"query":"BRAF"}},"controls":{"use_significance":true,"sample_size":2000,"timeout":5000},"connections":{"vertices":[{"field":"abstract","min_doc_count":10,"size":10}]},"vertices":[{"field":"abstract","min_doc_count":10,"size":10}]}

            https://qkorhkwgf1.execute-api.eu-west-1.amazonaws.com/dev/graph/explore
        */
        return {
            restrict: 'E',
            templateUrl: 'plugins/bibliography-target-treemap.html',
            //template: '<div><svg></svg></div>',
            scope: {
                target: '=',
                label: '='
            },
            link: function (scope, elem, attrs) {

                // network ?
                /*
                var preFlightUrl = 'https://qkorhkwgf1.execute-api.eu-west-1.amazonaws.com/dev/graph/explore'; //Object.keys(uniqueTargets).join('\n');
                var postData = {
                                    "query":{
                                        "query_string":{"query":"BRAF"}
                                    },
                                    "controls":{
                                        "use_significance":true,
                                        "sample_size":2000,
                                        "timeout":5000
                                    },
                                    "connections":{
                                        "vertices":[
                                            {"field":"abstract","min_doc_count":10,"size":10}
                                        ]
                                    },
                                    "vertices":[
                                        {"field":"abstract","min_doc_count":10,"size":10}
                                    ]
                                };
                $http.post(preFlightUrl, postData)
                    .then (function (resp) {
                        $log.log("*****");
                        $log.log(resp)
                        return resp.data;
                    })
                    //.then (function (data) {})
                */

                function addSelected(s){
                    selected.push(s.toLowerCase()); // to lower case for more accurate matching
                    return selected;
                }

                function onClick(d){
                    // $log.log(d);
                    addSelected(d.data.key);
                    getData();
                }

                function onBack(){
                    if(selected.length>1){
                        selected.pop();
                        getData();
                    }
                }

                function getData(){
                    //t0 = Date.now();
                    if( selected.length>0 ){
                        var targets = selected.join(",");
                        $http.get("https://qkorhkwgf1.execute-api.eu-west-1.amazonaws.com/dev/search?query="+targets+"&aggs=true")
                            .then (function (resp) {
                                return resp.data;
                            })
                            .then( function (data){
                                $log.warn("call took: " + data.took); //(Date.now() - t0)
                                onData(data);
                            })
                    }
                }


                // setup the SVG
                $timeout(function(){

                    biblio = s = elem.children().eq(0).children().eq(1)[0];

                    s = elem.children().eq(0).children().eq(0)[0];

                    svg = d3.select( s )
                        .attr("width", width)
                        .attr("height", (height + margin.top))
                        .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                        .style("shape-rendering", "crispEdges");


                    nav = svg.append("g")
                        .attr("class", "tm-nav");

                        nav.append("rect")
                            .attr("x", 1)
                            .attr("y", -margin.top)
                            .attr("width", width-2)
                            .attr("height", margin.top)
                            //.style("fill", "#336699");

                        nav.append("text")
                            .attr("x", 6)
                            .attr("y", 6 - margin.top)
                            .attr("dy", ".75em")
                            .text("");


                    chart = svg.append("g")
                        .attr("class", "tm-chart")
                        .attr("width", width)
                        .attr("height", height);


                    treemap = d3.treemap()
                        //.tile(d3.treemapSquarify)
                        .tile(d3.treemapSquarify.ratio(1))
                        .size([width/ratio, height])
                        //.round(true)
                        ;


                    // search ?
                    selected = selected || [scope.target.approved_symbol.toLowerCase()];
                    getData();




                })



                function onData(data){

                    // treemap
                    $log.log("data:");
                    $log.log(data);

                    //var children = data.aggregations.abstract_significant_terms.buckets.filter(function(b){
                    //var children = data.aggregations.top_chunks_significant_terms.buckets.filter(function(b){
                    var children = data.aggregations.keywords_significant_terms.buckets.filter(function(b){
                        return !selected.includes(b.key.toLowerCase());
                    })

                    var r = d3.hierarchy({children:children})
                            //.eachBefore(function(d) { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name; })
                            //.sum(function(d){ return d.children ? 0 : d.__association_score; })
                            .sum(function(d){ return d.score; })
                            .sort(function(a, b) { return b.height - a.height || b.value - a.value; });

                    treemap(r);


                    //display(r);
                    transition(r);

                    // literature
                    scope.hits = data.hits;

                }



                function display(d) {

                    //$log.log(d);

                    // navigation
                    nav
                        //.datum(selected)
                        .on("click", onBack)
                        .classed("tm-nav-hidden", selected.length==0 )
                        .select("text")
                        .text( selected.join(" > ") );


                    // actual treemap
                    var g1 = chart.append("g")
                        .datum(d.children)

                    var cell = g1.selectAll("g")
                        .data(d.children)
                        .enter().append("g");

                    // add click to cells with children
                    //cell.filter(function(d) { return d.children; })
                    //    .classed("children", true)
                        cell
                        .on("click", onClick);

                    // define a clippath to cut text
                    cell.append("clipPath")
                        .attr("id", function(d) { return "clip-" + d.data.key; })
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
                            .text(function(d) { return d.data.key; })
                            .attr("class", function(d){ return d.children ? "ta-label" : "disease-label"  })
                            .attr("clip-path", function(d) { return "url(#clip-" + d.data.key + ")"; });

                        cellLabel.append("tspan")
                            .attr("class", "ta-label-details")
                            .text( function(d){return "Score: "+d.data.score.toFixed(2)} )
                        ;

                        /*cellLabel.filter(function(d) { return d.children; })
                            .append("tspan")
                            .attr("class", "ta-label-details")
                            .text( function(d){return "Diseases: " + d.children.length } )
                        ;*/


                        cellLabel.call(text)
                        cellLabel.append("title")
                            .text(function(d) { return name(d); });


                    return cell;


                } // end display



                function transition(d) {
                    $log.log("transition");

                    if (transitioning || !d) return;
                    transitioning = true;


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


                    // Transitioning out of the old view (if there is one)
                    if(g1){
                        // $log.log("g1");
                        // $log.log(g1);
                        var t1 = g1.select(function(){return this.parentNode})  // since display returns the cell, here we need the 'parent'
                                    .transition().duration(500);
                        t1.selectAll("text").call(text).style("fill-opacity", 0);
                        t1.selectAll(".cell").call(rect);
                        t1.selectAll(".clippath").call(path);

                        // Remove the old node when the transition is finished.
                        t1.remove().on("end", function(){
                            console.log("t1 done");
                            t2ing();
                        });
                    } else{
                        t2ing();
                    }


                    // and into the new one:
                    function t2ing(){
                        g2 = display(d);
                        // $log.log("g2");
                        // $log.log(g2);
                        var t2 = g2.transition().duration(750);     // the new stuff coming in
                        g2.selectAll("text").style("fill-opacity", 0);
                        t2.selectAll("text").call(text).style("fill-opacity", 1);
                        t2.selectAll(".cell").call(rect);
                        t2.selectAll(".clippath").call(path);
                        t2.on("end", function(){
                            console.log("t2 done");
                            svg.style("shape-rendering", "crispEdges");
                            transitioning = false;
                            g1 = g2;
                        });
                    }

                }



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
                            .map(function(i){return i.data.key})
                            .slice(1)
                            .join(" > ");
                }

                function path(path){
                    path.attr("x", function(d) { return x(d.x0 * ratio)+4; })
                        .attr("y", function(d) { return y(d.y0)+4; })
                        .attr("width", function(d) { return Math.max( 0, (x(d.x1 * ratio) - x(d.x0 * ratio) - 8) ) ; })
                        .attr("height", function(d) { return Math.max( 0, (y(d.y1) - y(d.y0) - 8) ) ; });
                }





                /*
                var bibliography = _.filter(scope.target.dbxrefs, function (t) {
                    return t.match(/^PubMed/);
                });
                var cleanBibliography = _.map (bibliography, function (t) {
                    return t.substring(7, t.lenght);
                });
                var pmidsLinks = (_.map(cleanBibliography, function (p) {
                    return "EXT_ID:" + p;
                })).join (" OR ");
                scope.citations = {};

                $http.get("/proxy/www.ebi.ac.uk/europepmc/webservices/rest/search?query=" + pmidsLinks + "&format=json")
                    .then (function (resp) {
                        scope.citations.count = resp.data.hitCount;
                        scope.citations.europepmcLink = "//europepmc.org/search?query=" + pmidsLinks;
                        var citations = resp.data.resultList.result;
                        for (var i=0; i<citations.length; i++) {
                            var authorStr = citations[i].authorString;
                            if (authorStr[authorStr.length-1] === ".") {
                                authorStr = authorStr.slice(0,-1);
                            }
                            var authors = authorStr.split(', ');
                            citations[i].authors = authors;
                        }
                        scope.citations.all = resp.data.resultList.result;
                    });
                */

            }
        };
    }]);
