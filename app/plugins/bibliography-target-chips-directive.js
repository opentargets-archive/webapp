angular.module('plugins')
    .directive('bibliographyTargetChips', ['$log', '$http', 'cttvUtils', '$timeout', function ($log, $http, cttvUtils, $timeout) {
        'use strict';


        /*
            {"query":{"query_string":{"query":"BRAF"}},"controls":{"use_significance":true,"sample_size":2000,"timeout":5000},"connections":{"vertices":[{"field":"abstract","min_doc_count":10,"size":10}]},"vertices":[{"field":"abstract","min_doc_count":10,"size":10}]}

            https://qkorhkwgf1.execute-api.eu-west-1.amazonaws.com/dev/graph/explore
        */

        return {
            restrict: 'E',
            templateUrl: 'plugins/bibliography-target-chips.html',
            scope: {
                target: '=',
                label: '='
            },
            link: function (scope, elem, attrs) {


                //
                // Initialize things
                //


                var API_URL = "https://qkorhkwgf1.execute-api.eu-west-1.amazonaws.com/dev/search";
                var selected = [scope.target.approved_symbol];


                //////////////////////////////////////////
                //  set SCOPE
                //////////////////////////////////////////


                scope.onclick = onClick;
                scope.onback = onBack;
                scope.getMoreData = getMoreData;
                scope.selected = selected;

                getData();



                function cleanSpaces(input) {
                    return input.replace(/ /g,'_');
                }



                function addSelected(s){
                    selected.push(s); // to lower case for more accurate matching
                    return selected;
                }



                /*
                 * Handler for when clicking on a cell
                 */
                function onClick(d){
                    addSelected(d);
                    getData();
                }



                /*
                 * Handler for when we click on breadcrumb bar
                 */
                function onBack(d){
                    if(d<selected.length){
                        selected.splice(d,1);
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

                    scope.aggs_result_total = children.length;

                    scope.chips = children;

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
                    scope.hits.push(data.hits); // store every batch as a "page" of results
                    // calculate the number of papers shown
                    scope.noftotal = scope.hits.reduce(function(a,b){return a + b.hits.length}, 0);
                    // a flattened list of just the hits (publications) to avoid nested looping in the HTML if we want to
                    // scope.papers = scope.hits.reduce( function(a,b){ return a.concat(b.hits)} , [] );
                }

            }

        };

    }]);
