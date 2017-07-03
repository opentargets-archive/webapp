angular.module('plugins')
    .directive('bibliographyTargetTreemap', ['$log', '$http', 'cttvUtils', '$timeout', function ($log, $http, cttvUtils, $timeout) {
        'use strict';



        /*
            {"query":{"query_string":{"query":"BRAF"}},"controls":{"use_significance":true,"sample_size":2000,"timeout":5000},"connections":{"vertices":[{"field":"abstract","min_doc_count":10,"size":10}]},"vertices":[{"field":"abstract","min_doc_count":10,"size":10}]}

            https://qkorhkwgf1.execute-api.eu-west-1.amazonaws.com/dev/graph/explore
        */
        return {
            restrict: 'E',
            //require: 'resize',
            templateUrl: 'plugins/bibliography-target-treemap.html',
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



                //
                // Initialize things
                //



                var API_URL = "https://qkorhkwgf1.execute-api.eu-west-1.amazonaws.com/dev/search";

                var t0;
                var ratio = 2;  // this is to make the cells more "horizontal"

                var colorScale = cttvUtils.colorScales.BLUE_0_1; //blue orig

                var margin = {top: 30, right: 0, bottom: 0, left: 0},
                    //height = 250,
                    width = 908,
                    height = Math.floor(width/4),   // the height of the actual treemap (i.e. not including the navigation at top)
                    transitioning;

                var x = d3.scaleLinear();
                var y = d3.scaleLinear();
                var k = d3.scaleLinear();
                resetScales();

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
                    g2,
                    hobj            // the hierarchy object
                    ;



                // set initial width to fit container
                width = elem[0].firstChild.offsetWidth;
                height = Math.floor(width/4);



                // setup the SVG
                // needs to be in a timeout if the template is external
                $timeout(function(){

                    s = elem.children().eq(0).children().eq(1)[0];

                    svg = d3.select( s )
                        .attr("width", width)
                        .attr("height", (height + margin.top))
                        .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                        .style("shape-rendering", "crispEdges");


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


                    nav = svg.append("g")
                        .attr("class", "tm-nav");

                        nav.append("rect")
                            .attr("x", 0)
                            .attr("y", -margin.top)
                            .attr("width", width)
                            .attr("height", margin.top)

                        nav.append("text")
                            .attr("x", 6)
                            .attr("y", 9 - margin.top)
                            .attr("dy", ".75em")
                            .text("");

                    // search ?
                    // selected = selected || [scope.target.approved_symbol]; //.toLowerCase()];
                    selected = [scope.target.approved_symbol];
                    getData();

                })



                function resetScales(){
                    x.domain([0, width])
                     .range([0, width]);

                    y.domain([0, height])
                     .range([0, height]);
                }



                function cleanSpaces(input) {
                    return input.replace(/ /g,'_');
                }



                function invertScales(){
                    // x
                    var xd = x.domain();
                    var xr = x.range();
                    x.domain(xr);
                    x.range(xd);

                    // y
                    var yd = y.domain();
                    var ys = y.range();
                    y.domain(ys);
                    y.range(yd);
                }




                function addSelected(s){
                    selected.push(s); // to lower case for more accurate matching
                    return selected;
                }



                /*
                 * Handler for when clicking on a cell
                 */
                function onClick(d){
                    addSelected(d.data.key);
                    getData();
                }



                /*
                 * Handler for when we click on breadcrumb bar
                 */
                function onBack(){
                    if(selected.length>1){
                        selected.pop();
                        getData();
                    }
                }



                /*
                 * Builds and returns the search query string for target OR synomyms AND all other terms
                 */
                function getQuery(){
                    var ss = scope.target.symbol_synonyms || [];
                    var ns = /*scope.target.name_synonyms ||*/ [];  // don't use any name synomyms for now
                    var q = "(\"" + [selected[0]].concat(ss).concat(ns).join("\"OR\"") +"\")"; // e.g. : ("braf"AND"braf1"AND"braf2")
                    if( selected.length > 1){
                        q = q + "AND\"" + selected.slice(1).join("\"AND\"")+ "\"";  // e.g. : ("braf"AND"braf1"AND"braf2")AND"NRAS"AND"NRAS mutation"
                    }
                    return q;
                }



                /*
                 * Get data from the API
                 * we use one function to get all data because when we click on treemap we reset the literature
                 */
                function getData(){
                    if( selected.length>0 ){
                        scope.isloading = true;
                        var targets = selected.join("\"AND\"");
                        $http.get( API_URL+"?query="+getQuery()+"&aggs=true" )
                            .then (
                                function (resp) {
                                    return resp.data; // success
                                },
                                function (resp){
                                    $log.warn("Error: ",resp); // failure
                                    // TODO:
                                    // so here, in case of an error, we remove the last selected thing in the list (since we didn't get the data for it)
                                    // Perhaps a better approach is to add it only once we have a successful response
                                    selected.pop();
                                }
                            )
                            .then (
                                function (data){
                                    onData(data); // success
                                }
                            )
                            .finally (
                                function(d){
                                    scope.isloading = false;
                                }
                            )
                    }
                }



                /*
                 * Get more literature data:
                 * - fetch data from the last thing we got on previous result
                 * - no aggregations for treemap
                 */
                function getMoreData(){

                    // the  last element of the last page
                    var last = scope.hits[scope.hits.length-1].hits[scope.hits[scope.hits.length-1].hits.length-1];
                    var after = last.sort[0] || undefined ; // e.g. 1483228800000
                    var after_id = last._id || undefined ;  // e.g. 27921184

                    if(after && after_id){

                        $http.get( API_URL+"?query="+getQuery()+"&search_after="+after+"&search_after_id="+after_id )
                                .then (
                                    function (resp) {
                                        return resp.data; // success
                                    },
                                    function (resp){
                                        $log.warn("Error: ",resp); // failure
                                    }
                                )
                                .then (
                                    function (data){
                                        onData(data); // success
                                    }
                                )
                                .finally (
                                    function(d){
                                        scope.isloading = false;
                                    }
                                )

                    }
                }



                /*
                 * Handler for the response data
                 */
                function onData(data){
                    if( data.aggregations ){
                        onAggsData(data);
                    }

                    if( data.hits ){
                        onLiteratureData(data, data.aggregations!=undefined);
                    }
                }



                /*
                 * Handler for the aggregations data for the treemap
                 */
                function onAggsData(data){

                    //var children = data.aggregations.abstract_significant_terms.buckets.filter(function(b){
                    //var children = data.aggregations.top_chunks_significant_terms.buckets.filter(function(b){
                    var children = data.aggregations.keywords_significant_terms.buckets.filter(function(b){
                        /*
                        don't add these to the treemap if they appears in the "selected" array (i.e. those we clicked on)
                        or in the symbol synonyms
                        */

                        //return !selected.includes(b.key.toLowerCase());

                        // filter: case sensitive
                        // return !selected.includes(b.key) && !scope.target.symbol_synonyms.includes(b.key);

                        // filter: case insensitive
                        return selected.filter(function(a){return a.toLowerCase()==b.key.toLowerCase()}).length==0   &&   scope.target.symbol_synonyms.filter(function(a){return a.toLowerCase()==b.key.toLowerCase()}).length==0;
                    });

                    //$log.log(" > children : ", children);

                    scope.aggs_result_total = children.length;

                    if(children.length>0){

                        // d3.select( s )
                        // .attr("height", (height + margin.top));
                        var ts = d3.select( s ).transition().duration(500);
                        ts.attr("height", (height + margin.top));

                        hobj = d3.hierarchy({children:children})
                                //.sum(function(d){ return d.score; })
                                .sum(function(d){ return d.doc_count; })
                                .sort(function(a, b) { return b.height - a.height || b.value - a.value; });

                        updateTreemap();

                        // don't call display directly, instead let transition do the work
                        transition(hobj);

                    } else {

                        // d3.select( s )
                        // .attr("height", (margin.top));
                        var ts = d3.select( s ).transition().duration(500);
                        ts.attr("height", (margin.top));

                        updateNav();
                    }
                }



                /*
                 * Handler for literature data
                 * data : the API response data
                 * reset : if true, previous literature data is removed; if false (DEFAULT), new literature data is appended (e.g. pagination)
                 */
                function onLiteratureData(data, reset){
                    reset = reset || false;
                    if(reset){
                        scope.hits = [];
                        scope.noftotal = 0;
                    }
                    // literature
                    // scope.hits = data.hits;
                    scope.hits.push(data.hits); // store every batch as a "page" of results
                    // calculate the number of papers shown
                    scope.noftotal = scope.hits.reduce(function(a,b){return a + b.hits.length}, 0);
                    // a flattened list of just the hits (publications) to avoid nested looping in the HTML if we want to
                    // scope.papers = scope.hits.reduce( function(a,b){ return a.concat(b.hits)} , [] );
                }



                function updateTreemap(){

                    // reset the depths
                    hobj.depth = 0;
                    hobj.children.forEach(function(c){
                        c.depth = hobj.depth+1;
                    })

                    // recalculate layout
                    treemap(hobj);

                    // since we get data every time, the treemap is flat and has no knowledge of depth
                    // so we set that manually here.
                    // we need it for convenience when doing the transitions
                    hobj.depth = selected.length;
                    hobj.children.forEach(function(c){
                        c.depth = hobj.depth+1;
                    })
                    hobj.qid = selected[selected.length-1] ; // what did we click on to get this data? same as data.key
                }



                function updateNav(){
                    nav
                        //.datum(selected)
                        .on("click", onBack)
                        .classed("tm-nav-hidden", selected.length==0 )
                        .select("text")
                        .text( selected.join(" > ") );
                }



                /*
                 * Display the treemap:
                 * takes the hierarchy object and create/add elements to the svg
                 */
                function display(d) {

                    // navigation
                    updateNav();


                    // actual treemap
                    var g0 = chart.append("g")
                        //.datum(d.children)
                        .datum(d);

                    var cell = g0.selectAll("g")
                        .data(d.children)
                        .enter().append("g");

                    // add click to cells
                    cell.on("click", onClick);

                    // define a clippath to cut text
                    cell.append("clipPath")
                        .attr("id", function(d) { return "clip-" + cleanSpaces(d.data.key); })
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
                            //.attr("fill", function(d) { return colorScale(d.data.__association_score); })
                            .append("title")
                                .text(function(d) { return name(d); });

                    // add a parent rectangle
                    cell.append("rect")
                        .attr("class", "cell parent")
                        .call(rect)
                        //.attr("fill", function(d) { return colorScale(d.data.__association_score); })
                        .append("title")
                            .text(function(d) { return name(d); });

                    // Text
                    // we want to differentiate between therapeutic areas (i.e. those with children)
                    // and diseases (i.e. leaves)... just to complicate things a little
                    var cellLabel = cell.append("text")
                            .text(function(d) { return d.data.key; })
                            .attr("class", function(d){ return d.children ? "ta-label" : "disease-label"  })
                            .attr("clip-path", function(d) { return "url(#clip-" + cleanSpaces(d.data.key) + ")"; });

                        // remove the count for now, just to test based on feedback....
                        // TODO: we might want it back?
                        /*
                        cellLabel.append("tspan")
                            .attr("class", "ta-label-details")
                            //.text( function(d){return "Score: "+d.data.score.toFixed(2)} )
                            .text( function(d){return d.data.doc_count} )
                        ;
                        */

                        cellLabel.call(text)
                        cellLabel.append("title")
                            .text(function(d) { return name(d); });

                    // return the "g" element
                    return g0;


                } // end display



                /*
                 * Display and transition the given data
                 * d1, d2 = treemap hierarchy data
                 * g1, g2 = the g contexts returned by display()
                 */
                function transition(d2) {

                    // set things up
                    if (transitioning || !d2) return;
                    transitioning = true;
                    // Enable anti-aliasing during the transition
                    svg.style("shape-rendering", null);
                    // Draw child nodes on top of parent nodes
                    svg.selectAll(".tm-chart").nodes().sort(
                        function(a, b) {
                            return a.depth - b.depth;
                        });

                    var d1, zoom;


                    // draw the new data in the correct (final) position
                    // we need this before we start looking at zooming...
                    g2 = display(d2);


                    // Transition the old view out:
                    // (if there is one)
                    if(g1){

                        zoom = Math.sign( d2.depth - g1.datum().depth );

                        // what did we click on? it depends on the zoom (in, or out)
                        if(zoom>0){
                            d1 = g1.selectAll("g").filter(function(d){
                                return d.data.key === g2.datum().qid;
                            }).data()[0]; // there should be only 1 element
                            x.domain([d1.x0*ratio, d1.x1*ratio]);
                            y.domain([d1.y0, d1.y1]);
                        }else if(zoom<0){
                            d1 = g2.selectAll("g").filter(function(d){
                                return d.data.key === g1.datum().qid;
                            }).data()[0];
                            x.range([d1.x0*ratio, d1.x1*ratio]);
                            y.range([d1.y0, d1.y1]);
                        }

                        // transition the old content immediately
                        var t1 = g1.transition().duration(750);
                        t1.selectAll("text").call(text).style("fill-opacity", 0);
                        t1.selectAll(".cell").call(rect);
                        t1.selectAll(".clippath").call(path);

                        // Remove the old node when the transition is finished.
                        t1.remove().on("end", function(){});

                    }


                    // set the dimension of the new content before transition
                    // (so it will then transition in to the proper dimensions)
                    invertScales();
                    g2.selectAll("text").call(text).style("fill-opacity", 0);
                    g2.selectAll(".cell").call(rect).style("fill-opacity", 0);
                    g2.selectAll(".clippath").call(path);
                    resetScales();


                    // transition the new view in
                    var t2 = g2.transition().duration(750);     // the new stuff coming in
                    t2.selectAll("text").call(text).style("fill-opacity", 1);
                    t2.selectAll(".cell").call(rect).style("fill-opacity",1);
                    t2.selectAll(".clippath").call(path);
                    t2.on("end", function(){
                        svg.style("shape-rendering", "crispEdges");
                        transitioning = false;
                        g1 = g2;
                    });

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



                //////////////////////////////////////////

                //  SCOPE FUNCTIONS

                //////////////////////////////////////////



                scope.getMoreData = getMoreData;



                /*
                 * Scale things on resize
                 */
                scope.onres = function(r){
                    // $log.log(' > onres : ', r);

                    width = r.w;
                    resetScales();

                    d3.select( s ).attr("width", width);
                    nav.select("rect").attr("width", width);
                    chart.attr("width", width);

                    treemap.size([width/ratio, height]);
                    updateTreemap();

                    chart.selectAll("g").remove();
                    g1 = display(hobj);

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
