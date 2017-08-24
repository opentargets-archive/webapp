angular.module('cttvDirectives')


    .directive('targetListMapping', ['cttvAPIservice', 'cttvUtils', 'cttvLoadedLists', 'cttvConfig', function (cttvAPIservice, cttvUtils, cttvLoadedLists, cttvConfig) {
        'use strict';

        return {
            restrict: 'E',
            scope: {
                list: '='
            },
            templateUrl: 'src/components/batch-search/target-list-mapping.html',
            link: function (scope) {

            // Setting the limit for the list:
                scope.listLengthLimit = cttvConfig.targetListLimit;


                function search (q) {
                    var queryObject = {
                        method: 'GET',
                        trackCall: false,
                        params: {
                            q: q,
                            filter: 'target',
                            size: 10,
                            fields: 'approved_symbol'
                        }
                    };

                    return cttvAPIservice.getSearch(queryObject);
                }

                // scope.setNewItem = function (oldQuery, res) {
                //     var queryIndex = _.findIndex(scope.list.list, function (o) {
                //         return (o.query === oldQuery);
                //     });
                //     scope.list.list.splice(queryIndex, 1);
                //     scope.list.list.unshift({
                //         query: res.data.approved_symbol,
                //         result: {
                //             approved_symbol: res.data.approved_symbol,
                //             id: res.id,
                //             query: res.data.approved_symbol,
                //             isExact: true,
                //             isNew: true
                //         }
                //     });
                //
                //     // Scroll top the batch-search-mappings-container-exact div
                //     $('#batch-search-mappings-container-exact').scrollTop(0);
                // };

                scope.getSearch = function (queryTxt) {
                    scope.newSearchResults = [];
                    scope.duplicated = [];
                    if (queryTxt) {
                        scope.searchInProgress = true;
                        search(queryTxt)
                            .then(function (resp) {
                            // We filter out search results that are already in the list
                                for (var i = 0; i < resp.body.data.length; i++) {
                                    var thisSearch = resp.body.data[i];
                                    if (scope.list.keys[thisSearch.id]) {
                                        scope.duplicated.push(thisSearch.data.approved_symbol);
                                    } else {
                                        scope.newSearchResults.push(thisSearch);
                                    }
                                }
                            // scope.newSearchResults = resp.body.data;
                            })
                            .finally(function () {
                                scope.searchInProgress = false;
                            });
                    } else {
                        scope.newSearchResults = [];
                        scope.duplicated = [];
                        scope.searchInProgress = false;
                        scope.$apply(scope.newSearchResults);
                    }
                };

                // scope.newSearch = function (query) {
                //     scope.newSearchQuery = query.query;
                // };

                scope.toggleThis = function (query) {
                    for (var i = 0; i < scope.list.list.length; i++) {
                        var item = scope.list.list[i];
                        if (item.query === query.query) {
                            item.selected = !item.selected;
                            break;
                        }
                    }
                    cttvLoadedLists.save();
                };

                scope.toAddFromSearch = {};
                scope.addRemove = function (search) {
                    if (scope.toAddFromSearch[search.id]) {
                        delete scope.toAddFromSearch[search.id];
                    } else {
                        if (search.id && search.data) {
                            var parsed = {
                                approved_symbol: search.data.approved_symbol,
                                id: search.id,
                                // isExact: true,
                                query: search.data.approved_symbol,
                                isNew: true
                            };
                        }

                        scope.toAddFromSearch[search.id] = {
                            query: search.data.approved_symbol,
                            selected: true,
                            result: parsed
                        };
                    }
                };

                scope.discardSearch = function () {
                    scope.newSearchQuery = '';
                    scope.searchQueryText = '';
                    scope.newSearchResults = [];
                    scope.duplicated = [];

                    // We incorporate the selected search results
                    for (var res in scope.toAddFromSearch) {
                        if (scope.toAddFromSearch.hasOwnProperty(res)) {
                            scope.list.keys[scope.toAddFromSearch[res].result.id] = true;
                            scope.list.list.unshift(scope.toAddFromSearch[res]);
                            delete scope.toAddFromSearch[res];
                        }
                    }
                    cttvLoadedLists.save();
                };


                //
                // scope.discardThis = function (query) {
                //     // query.discarded = true;
                //     for (var i=0; i<scope.list.list.length; i++) {
                //         var item = scope.list.list[i];
                //         if (item.query === query.query) {
                //             item.discarded = true;
                //             break;
                //         }
                //     }
                // };
                //
                scope.selectThis = function (query, match) {
                    for (var i = 0; i < scope.list.list.length; i++) {
                        var item = scope.list.list[i];
                        if (item.query === query.query) {
                            item.result.id = match.id;
                            item.result.approved_symbol = match.data.approved_symbol;
                            item.selected = true;
                        }
                    }
                    delete(scope.searchQuery);
                    cttvLoadedLists.save();
                };

                // scope.restoreThis = function (query) {
                //     for (var i=0; i<scope.list.list.length; i++) {
                //         var item = scope.list.list[i];
                //         if (item.query === query.query) {
                //             item.discarded = false;
                //         }
                //     }
                // };


                scope.searchThis = function (who) {
                    scope.searchQuery = who;

                    search(who.query)
                        .then(function (resp) {
                            scope.searchResults = resp.body.data;
                        });
                };

                // Downloads the list
                scope.downloadList = function () {
                    var listText = '';
                    for (var i = 0; i < scope.list.list.length; i++) {
                        var item = scope.list.list[i];
                        if (item.result) {
                            listText += item.result.approved_symbol + '\n';
                        }
                    }
                    var b = new Blob([listText], {type: 'text/csv;charset=utf-8'});
                    saveAs(b, scope.list.id);
                };

                scope.newSearchResults = [];
                scope.duplicated = [];
                scope.$watch('list', function (l) {
                    if (!l) {
                        return;
                    }

                    var thisList = l.list;
                    scope.notFound = [];
                    scope.exact = [];
                    scope.fuzzy = [];
                    scope.rescued = [];
                    scope.duplications = l.duplications;

                    scope.targetIds = [];

                    for (var i = 0; i < thisList.length; i++) {

                        var thisSearch = thisList[i];

                        if (thisSearch.result && thisSearch.result.approved_symbol) {
                            if (thisSearch.result.isExact) {
                                scope.exact.push({
                                    query: thisSearch.query,
                                    selected: thisSearch.selected,
                                    // discarded: thisSearch.discarded,
                                    result: thisSearch.result.approved_symbol
                                // isNew: thisSearch.result.isNew
                                });
                                if (thisSearch.selected) {
                                    scope.targetIds.push(thisSearch.result.id);
                                }
                            } else if (thisSearch.result.isNew) {
                                scope.rescued.push({
                                    query: thisSearch.query,
                                    selected: thisSearch.selected,
                                    result: thisSearch.result.approved_symbol
                                });
                                if (thisSearch.selected) {
                                    scope.targetIds.push(thisSearch.result.id);
                                }
                            } else {
                                scope.fuzzy.push({
                                    query: thisSearch.query,
                                    // discarded: thisSearch.discarded,
                                    selected: thisSearch.selected,
                                    result: thisSearch.result.approved_symbol
                                });
                                if (thisSearch.selected) {
                                    scope.targetIds.push(thisSearch.result.id);
                                }
                            }

                        } else {
                            scope.notFound.push({
                                query: thisSearch.query,
                                result: '?'
                            });
                        }
                    }

                    if (scope.targetIds.length) {
                        var compressedUrl = cttvUtils.compressTargetIds(scope.targetIds).join(',');
                        scope.summaryLink = '/summary?targets=' + compressedUrl;
                    // scope.summaryLink = "/summary?target-list=" + l.id;
                    // scope.summaryLink = "/summary?" + (scope.targetIds.map(function (t) {return "target=" + t;}).join("&"));
                    }
                }, true); // Deep watching the list
            }
        };
    }]);
