angular.module('otPlugins')
    .directive('otBibliographyTargetChips', ['$log', '$http', '$timeout', function ($log, $http, $timeout) {
        'use strict';


        /*
            {'query':{'query_string':{'query':'BRAF'}},'controls':{'use_significance':true,'sample_size':2000,'timeout':5000},'connections':{'vertices':[{'field':'abstract','min_doc_count':10,'size':10}]},'vertices':[{'field':'abstract','min_doc_count':10,'size':10}]}

            https://qkorhkwgf1.execute-api.eu-west-1.amazonaws.com/dev/graph/explore
        */

        return {
            restrict: 'E',
            templateUrl: 'plugins/bibliography-chips/bibliography-target-chips.html',
            scope: {
                target: '=',
                label: '='
            },
            link: function (scope, elem, attrs) {
                //
                // Initialize things
                //


                var API_URL = 'https://vy36p7a9ld.execute-api.eu-west-1.amazonaws.com/dev/search'; // 'https://qkorhkwgf1.execute-api.eu-west-1.amazonaws.com/dev/search';
                var selected = [];
                resetSelected();


                /*
                //  set SCOPE
                */


                scope.onclick = onClick;
                scope.onback = onBack;
                scope.getMoreData = getMoreData;
                scope.selected = selected;
                scope.isloading = false;

                scope.selectedagg;

                scope.aggtype = [
                    {id: 'top_chunks_significant_terms', label: 'Concepts'},
                    {id: 'genes', label: 'Genes'},
                    {id: 'diseases', label: 'Diseases'},
                    // {id: 'phenotypes', label: 'Phenotypes'}, // phenotypes don't return any hits at the moment, so leaving out...
                    {id: 'drugs', label: 'Drugs'},
                    {id: 'journal_abbr_significant_terms', label: 'Journal'},
                    {id: 'authors_significant_terms', label: 'Authors'}
                    // {id: 'pub_date_histogram', label: 'publication date'}
                ];

                /*
                    'top_chunks_significant_terms': {} // 'concepts'
                    // 'acronym_significant_terms': {},
                    'authors_significant_terms': {},    // authors
                    'diseases': {},
                    'drugs': {},
                    'genes': {},    // genes
                    'journal_abbr_significant_terms': {},   // journal
                    // 'phenotypes': {},
                    // 'pub_date_histogram': {}, // todo, maybe
                */

                scope.$watch('selectedagg', function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        var refetchData = selected.length > 1;
                        resetSelected();

                        if (refetchData) {
                            getData();
                        } else {
                            onSelectAggsData();
                        }
                    }
                });

                function resetSelected () {
                    // selected = selected || [scope.target.approved_symbol]; //.toLowerCase()];
                    selected.length = 0;
                    selected.push({key: scope.target.approved_symbol});
                }


                function cleanSpaces (input) {
                    return input.replace(/ /g, '_');
                }


                function addSelected (s) {
                    selected.push(s); // to lower case for more accurate matching
                    return selected;
                }


                /*
                 * Handler for when clicking on a cell
                 */
                function onClick (d) {
                    addSelected(d);
                    getData();
                }


                /*
                 * Handler for when we click on breadcrumb bar
                 */
                function onBack (d) {
                    if (d < selected.length) {
                        selected.splice(d, 1);
                        getData();
                    }
                }


                /*
                 * Builds and returns the search query string for target OR synomyms AND all other terms
                 */
                function getQuery () {
                    // var ss = scope.target.symbol_synonyms || [];
                    // var ns = /* scope.target.name_synonyms ||*/ [];  // don't use any name synomyms for now
                    // var q = '(\'' + [selected[0]].concat(ss).concat(ns).join('\'OR\'') + '\')'; // e.g. : ('braf'AND'braf1'AND'braf2')
                    var q = scope.target.id;
                    if (selected.length > 1) {
                        // q = q + ' AND \'' + selected.slice(1).join('\' AND \'') + '\'';  // e.g. : ('braf'AND'braf1'AND'braf2')AND'NRAS'AND'NRAS mutation'
                        q = [q].concat(
                            selected.slice(1)
                                .map(function (s) {
                                    return '\'' + s.key + '\'';
                                })
                        )
                            .join(' AND ');
                    }
                    return q;
                }


                /*
                 * Get data from the API
                 * we use one function to get all data because when we click on treemap we reset the literature
                 */
                function getData () {
                    if (selected.length > 0) {
                        scope.isloading = true;
                        var targets = selected.join('\'AND\'');
                        $http.get(API_URL + '?query=' + getQuery() + '&aggs=true')
                            .then(
                                function (resp) {
                                    return resp.data; // success
                                },
                                function (resp) {
                                    $log.warn('Error: ', resp); // failure
                                    // TODO:
                                    // so here, in case of an error, we remove the last selected thing in the list (since we didn't get the data for it)
                                    // Perhaps a better approach is to add it only once we have a successful response
                                    selected.pop();
                                }
                            )
                            .then(
                                function (data) {
                                    onData(data); // success
                                }
                            )
                            .finally(
                                function (d) {
                                    scope.isloading = false;
                                }
                            );
                    }
                }


                /*
                 * Get more literature data:
                 * - fetch data from the last thing we got on previous result
                 * - no aggregations for treemap
                 */
                function getMoreData () {
                    // the  last element of the last page
                    var last = scope.hits[scope.hits.length - 1].hits[scope.hits[scope.hits.length - 1].hits.length - 1];
                    var after = last.sort[0] || undefined; // e.g. 1483228800000
                    var after_id = last._id || undefined;  // e.g. 27921184

                    if (after && after_id) {
                        scope.isloading = true;
                        $http.get(API_URL + '?query=' + getQuery() + '&search_after=' + after + '&search_after_id=' + after_id)
                            .then(
                                function (resp) {
                                    return resp.data; // success
                                },
                                function (resp) {
                                    $log.warn('Error: ', resp); // failure
                                }
                            )
                            .then(
                                function (data) {
                                    onData(data); // success
                                }
                            )
                            .finally(
                                function (d) {
                                    scope.isloading = false;
                                }
                            );
                    }
                }


                /*
                 * Handler for the response data
                 */
                function onData (data) {
                    // $log.log('onData');
                    if (data.aggregations) {
                        onAggsData(data);
                    }

                    if (data.hits) {
                        onLiteratureData(data, data.aggregations !== undefined);
                    }
                }


                function parseDiseaseAggs (aggs) {
                    aggs.diseases.buckets.map(function (b) {
                        b.key = b.key.split('/').pop();
                        return b;
                    });
                    // $log.log(aggs.diseases);
                    return aggs;
                }


                /*
                 * Handler for the aggregations data for the treemap
                 */
                function onAggsData (data) {
                    // $log.log('onAggsData');
                    scope.aggs = parseDiseaseAggs(data.aggregations);
                    scope.selectedagg = scope.selectedagg || scope.aggtype[0].id || _.keys(scope.aggs)[0];

                    onSelectAggsData();
                }


                function onSelectAggsData () {
                    // $log.log('onSelectedAggsData');
                    // $log.log('*** onSelectAggsData ***');
                    // var children = data.aggregations.abstract_significant_terms.buckets.filter(function(b){
                    // var children = data.aggregations.top_chunks_significant_terms.buckets.filter(function(b){
                    // $log.log('selection:', scope.selectedagg);
                    // $log.log('aggs:', scope.aggs);
                    var children = scope.aggs[scope.selectedagg].buckets.filter(function (b) {
                        //
                        // don't add these to the treemap if they appears in the 'selected' array (i.e. those we clicked on) or in the symbol synonyms
                        //

                        // no filtering
                        // return !selected.includes(b.key.toLowerCase());

                        // filter: case sensitive
                        // return !selected.includes(b.key) && !scope.target.symbol_synonyms.includes(b.key);

                        // filter: case insensitive
                        // return selected.filter(function (a) { return a.key.toLowerCase() === b.key.toString().toLowerCase(); }).length === 0   &&  
                        //     scope.target.symbol_synonyms.filter(function (a) { return a.toLowerCase() === b.key.toString().toLowerCase(); }).length === 0;

                        // a = selected // b = current 'bucket' we're checking
                        return selected.filter(function (a) { return a.key.toString().toLowerCase() === b.key.toString().toLowerCase(); }).length === 0 &&
                        // a = synonyms // b = current 'bucket' we're checking
                            scope.target.symbol_synonyms.filter(function (a) { return a.toLowerCase() === b.key.toString().toLowerCase(); }).length === 0;
                    });

                    scope.aggs_result_total = children.length;

                    scope.chips = children;
                }


                /*
                 * Handler for literature data
                 * data : the API response data
                 * reset : if true, previous literature data is removed; if false (DEFAULT), new literature data is appended (e.g. pagination)
                 */
                function onLiteratureData (data, reset) {
                    // $log.log('onLiteratureData');
                    reset = reset || false;
                    if (reset) {
                        scope.hits = [];
                        scope.noftotal = 0;
                    }
                    // literature
                    scope.hits.push(data.hits); // store every batch as a 'page' of results
                    // calculate the number of papers shown
                    scope.noftotal = scope.hits.reduce(function (a, b) { return a + b.hits.length; }, 0);
                    // a flattened list of just the hits (publications) to avoid nested looping in the HTML if we want to
                    // scope.papers = scope.hits.reduce( function(a,b){ return a.concat(b.hits)} , [] );
                }

                // getData();
                $timeout(getData, 1);
            }

        };
    }]);
