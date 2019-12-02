angular.module('otPlugins')
    .directive('otBibliographyTargetChips', ['$log', '$http', '$timeout', '$sce', function ($log, $http, $timeout, $sce) {
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
                disease: '=',
                ext: '=?',
                label: '=',
                q: '=?'
            },
            link: function (scope, elem, attrs) {
                //
                // Initialize things
                //


                // var API_URL = 'https://link.opentargets.io/';
                var API_URL = 'https://master-dot-open-targets-library.appspot.com/';
                var selected = [];
                resetSelected();


                //
                //  set SCOPE
                //


                scope.onclick = onClick;
                scope.onback = onBack;
                scope.getMoreData = getMoreData;
                scope.selected = selected;
                scope.isloading = 0; // false;
                scope.isloading_aggs = false;
                scope.isloading_hits = false;

                scope.selectedagg;

                scope.getAbstract = function (src) {
                    // https://link.opentargets.io//entity/markedtext/28407239
                    $http.get(API_URL + 'entity/markedtext/' + src.pub_id)
                        .then(
                            function (resp) {
                                src.marked = resp.data;
                                src.marked.abstract = $sce.trustAsHtml(src.marked.abstract);
                            },
                            function (resp) {
                                $log.warn('Error: ', resp); // failure
                            }
                        );
                };


                scope.getSimilar = function (src) {
                    // https://link.opentargets.io/document-more-like-this/28407239
                    $http.get(API_URL + 'document-more-like-this/' + src.pub_id)
                        .then(
                            function (resp) {
                                src.similar = resp.data.hits;
                                return resp.data; // success
                            },
                            function (resp) {
                                $log.warn('Error: ', resp); // failure
                            }
                        );
                };


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

                scope.$watch('selectedagg', function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        var refetchData = selected.length > 1;
                        // resetSelected();

                        // if (refetchData) {
                        //     getData();
                        // } else {
                        //     onSelectAggsData();
                        // }
                        onSelectAggsData();
                    }
                });

                scope.$watch('q', function (nv, ov) {
                    if (ov === undefined && nv !== undefined) {
                        resetSelected();
                    }
                });

                function resetSelected () {
                    // selected = selected || [scope.target.approved_symbol]; //.toLowerCase()];

                    selected.length = 0;
                    var o = {
                        key: scope.q,
                        label: scope.q
                    };

                    if (scope.target) {
                        o.key = scope.target.id;
                        o.label = scope.target.approved_symbol;
                    } else if (scope.disease) {
                        o.key = scope.disease.efo;
                        o.label = scope.disease.label;
                    }

                    selected.push(o);
                    // selected.push({
                    //     key: (scope.target ? scope.target.id : scope.disease.efo || scope.q),
                    //     label: (scope.target ? scope.target.approved_symbol : scope.disease.label) || q
                    // });
                }


                function cleanSpaces (input) {
                    return input.replace(/ /g, '_');
                }


                function addSelected (s) {
                    // some aggregations don't have a label, so we add one for consistency
                    // so that we can then filter selected aggregation itmes in onSelectAggsData()
                    s.label = s.label || s.key;
                    selected.push(s);
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
                    var q = selected[0].key; // scope.target.id;
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
                        // scope.isloading = true;
                        var targets = selected.join('\'AND\'');

                        // We now make 2 calls: 1 for the chips and 1 for the papers;
                        // This is because aggregations can be computationally demanding (e.g. for neoplasm) and fail.
                        // By splitting the call we always have some papers to show

                        // 1. get chips only
                        // scope.isloading++;
                        scope.isloading_aggs = true;
                        $http.get(API_URL + 'search?query=' + getQuery() + '&aggs=true&size=0')
                            .then(
                                function (resp) {
                                    return resp.data; // success
                                },
                                function (resp) {
                                    $log.warn('Error: ', resp); // failure
                                    // in case of an error we remove the last selected thing in the list (since we didn't get the data for it)
                                    if (selected.length > 1) {
                                        selected.pop();
                                    }
                                }
                            )
                            .then(
                                function (data) {
                                    // onData(data); // success
                                    onAggsData(data);
                                }
                            )
                            .finally(
                                function (d) {
                                    // scope.isloading--;
                                    scope.isloading_aggs = false;
                                }
                            );

                        // 2. get papers
                        // scope.isloading++;
                        scope.isloading_hits = true;
                        $http.get(API_URL + 'search?query=' + getQuery())
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
                                    // onData(data); // success
                                    onLiteratureData(data, true);
                                }
                            )
                            .finally(
                                function (d) {
                                    // scope.isloading--;
                                    scope.isloading_hits = false;
                                }
                            );

                        /* $http.get(API_URL + 'search?query=' + getQuery() + '&aggs=true')
                            .then(
                                function (resp) {
                                    $log.info(resp);
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
                            );*/
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
                        // scope.isloading++; // = true;
                        scope.isloading_hits = true;
                        $http.get(API_URL + 'search?query=' + getQuery() + '&search_after=' + after + '&search_after_id=' + after_id)
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
                                    // onData(data); // success
                                    onLiteratureData(data, false);
                                }
                            )
                            .finally(
                                function (d) {
                                    // scope.isloading--; // = false;
                                    scope.isloading_hits = false;
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

                    if (data.hits && data.hits.hits.length > 0) {
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
                        return selected.filter(
                            function (a) {
                                // a = selected // b = current 'bucket' we're checking
                                return a.key.toString().toLowerCase() === b.key.toString().toLowerCase() ||
                                        a.label.toString().toLowerCase() === b.key.toString().toLowerCase();
                            }
                        ).length === 0; // &&
                        // a = synonyms // b = current 'bucket' we're checking
                        // (scope.target ? (scope.target.symbol_synonyms.filter(function (a) { return a.toLowerCase() === b.key.toString().toLowerCase(); }).length === 0) : true);
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
