angular.module('cttvDirectives')


.directive ('targetListMapping', ['$log', 'cttvAPIservice', function ($log, cttvAPIservice) {
    'use strict';

    return {
        restrict: 'E',
        scope: {
            list: '='
        },
        templateUrl: "partials/target-list-mapping.html",
        link: function (scope, el, attrs) {

            function search (q) {
                var queryObject = {
                    method: 'GET',
                    trackCall: false,
                    params: {
                        q: q,
                        filter: "target",
                        size: 10,
                        fields: "approved_symbol"
                    }
                };

                return cttvAPIservice.getSearch(queryObject)
            }

            scope.setNewItem = function (oldQuery, res) {
                var queryIndex = _.findIndex(scope.list.list, function (o) {
                    return (o.query === oldQuery);
                });
                scope.list.list.splice(queryIndex, 1);
                scope.list.list.unshift({
                    query: res.data.approved_symbol,
                    result: {
                        approved_symbol: res.data.approved_symbol,
                        id: res.id,
                        query: res.data.approved_symbol,
                        isExact: true,
                        isNew: true
                    }
                });
                scope.newSearchQuery = '';

                // Scroll top the batch-search-mappings-container-exact div
                $('#batch-search-mappings-container-exact').scrollTop(0);
            };

            scope.getSearch = function (queryTxt) {
                if (queryTxt) {
                    scope.searchInProgress = true;
                    search (queryTxt)
                        .then (function (resp) {
                            scope.searchInProgress = false;
                            scope.newSearchResults = resp.body.data;
                        })
                        .finally (function () {
                            scope.searchInProgress = false;
                        });
                } else {
                    scope.newSearchResults = [];
                    scope.searchInProgress = false;
                    scope.$apply(scope.newSearchResults);
                }
            };

            scope.newSearch = function (query) {
                scope.newSearchQuery = query.query;
            };


            //
            scope.discardThis = function (query) {
                // query.discarded = true;
                for (var i=0; i<scope.list.list.length; i++) {
                    var item = scope.list.list[i];
                    if (item.query === query.query) {
                        item.discarded = true;
                    }
                }
            };

            scope.selectThis = function (query, match) {
                for (var i=0; i<scope.list.list.length; i++) {
                    var item = scope.list.list[i];
                    item.discarded = false;
                    if (item.query === query.query) {
                        item.result.id = match.id;
                        item.result.approved_symbol = match.data.approved_symbol;
                        item.discarded = false;
                    }
                }
                delete(scope.searchQuery);
            };
            scope.restoreThis = function (query) {
                for (var i=0; i<scope.list.list.length; i++) {
                    var item = scope.list.list[i];
                    if (item.query === query.query) {
                        item.discarded = false;
                    }
                }
            };
            scope.searchThis = function (who) {
                scope.searchQuery = who;

                search(who.query)
                    .then (function (resp) {
                        scope.searchResults = resp.body.data;
                    });
            };

            scope.$watch('list', function (l) {
                if (!l) {
                    return;
                }

                var thisList = l.list;
                scope.notFound = [];
                scope.exact = [];
                scope.fuzzy = [];
                scope.rescued = [];

                scope.targetIds = [];

                for (var i=0; i<thisList.length; i++) {
                    var thisSearch = thisList[i];
                    if (thisSearch.result && thisSearch.result.approved_symbol) {
                        if (thisSearch.result.isExact) {
                            scope.exact.push({
                                query: thisSearch.query,
                                result: thisSearch.result.approved_symbol,
                                isNew: thisSearch.result.isNew
                            });
                            if (thisSearch.result.isNew) {
                                scope.rescued.push(thisSearch.query);
                            }
                            scope.targetIds.push(thisSearch.result.id);
                        } else {
                            scope.fuzzy.push({
                                query: thisSearch.query,
                                discarded: thisSearch.discarded,
                                result: thisSearch.result.approved_symbol
                            });
                            if (!thisSearch.discarded) {
                                scope.targetIds.push(thisSearch.result.id);
                            }
                        }

                    } else {
                        scope.notFound.push({
                            query: thisSearch.query,
                            result: "?"
                        });
                    }
                }

                if (scope.targetIds.length) {
                    scope.summaryLink = "/summary?" + (scope.targetIds.map(function (t) {return "target=" + t;}).join("&"));
                }
            }, true); // Deep watching the list
        }
    };
}])

.directive ('targetListUpload', ['$log', 'cttvAPIservice', 'cttvLoadedLists', '$q', function ($log, cttvAPIservice, cttvLoadedLists, $q) {
    'use strict';

    return {
        restrict: 'E',
        scope: {
            list: '='
        },
        templateUrl: "partials/target-list-upload.html",
        link: function (scope, elem, attrs) {

            // Show all previous lists
            scope.lists = cttvLoadedLists.getAll();

            scope.useThisList = function (listId) {
                scope.list = cttvLoadedLists.get(listId);
            };
            scope.removeThisList = function (listId) {
                scope.lists = cttvLoadedLists.remove(listId);
            };

            // Show the latest loaded list by default:
            scope.list = scope.lists[scope.lists.length-1];

            // In searches we store the searched term (target in the list) with its search promise
            scope.uploadFile = function () {
                var file = elem[0].getElementsByTagName("input")[0].files[0];
                var reader = new FileReader();
                reader.onloadend = function (e) {
                    var fileContent = e.target.result;
                    var targets = fileContent.replace(/(\r\n|\n|\r|,)/gm, '\n').split('\n');
                    targets = targets.filter(function (t) {if (t) return true;})

                    var opts = {
                        q: targets,
                        filter: 'target',
                        fields: 'approved_symbol'
                    };

                    var queryObject = {
                        method: "POST",
                        params: opts
                    };

                    var listSearch = [];
                    cttvAPIservice.getBestHitSearch(queryObject)
                        .then (function (resp) {
                            var parsed;
                            for (var i=0; i<resp.body.data.length; i++) {
                                var search = resp.body.data[i];
                                parsed = undefined;
                                if (search.id && search.data) {
                                    parsed = {
                                        approved_symbol: search.data.approved_symbol,
                                        id: search.id,
                                        isExact: search.exact,
                                        query: search.q
                                    };
                                }
                                listSearch.push({
                                    query: search.q,
                                    result: parsed
                                })
                            }
                            cttvLoadedLists.add(file.name, listSearch);

                            // Show all previous lists
                            scope.lists = cttvLoadedLists.getAll();
                            scope.list = cttvLoadedLists.get(file.name);
                        });

                };
                reader.readAsText(file);
            };
        }
    };
}]);

// .directive ('targetListAssociationsFoamtree', ['$log', '$timeout', 'cttvAPIservice', function ($log, $timeout, cttvAPIservice) {
//     'use strict';
//     return {
//         restrict: 'E',
//         template: '<div id="foamtree" style="width: {{width}}px; height: {{height}}px"></div>',
//         scope: {
//             list: '=',
//             active: '='
//         },
//         link: function (scope, elem, attrs) {
//             scope.$watchGroup(['list', 'active'], function () {
//                 var foamtree = {};
//
//                 if (!scope.list || !scope.active) {
//                     return;
//                 }
//
//                 var container = document.createElement('div');
//                 elem[0].appendChild(container);
//
//                 var targetList = _.filter(_.map(scope.list.list, "result.id"));
//
//                 var queryObject = {
//                     method: 'POST',
//                     params: {
//                         target: targetList,
//                         outputstructure: "flat",
//                         size: 1000,
//                         facets: false
//                     }
//                 };
//                 cttvAPIservice.getAssociations(queryObject)
//                     .then (function (resp) {
//                         var dataObject = processData (resp.body);
//                         drawFoamTree(dataObject);
//                     });
//
//
//                 function processData (body) {
//                     var diseaseCounts = uniqueAssociations(body.data);
//                     body.childrenProperty = "groups";
//                     var tree = cttvAPIservice.getSelf().utils.flat2tree(body);
//                     addCounts(tree, diseaseCounts);
//                     normaliseScore(tree);
//                     return tree;
//                 }
//
//                 // Given a tree structure and a disease this function add the counts to each node in the tree
//                 function addCounts (tree, counts) {
//                     tree.association_score = counts[tree.__id] ? Object.keys(counts[tree.__id]).length : 0;
//                     tree.shared_targets_symbols = counts[tree.__id];
//                     if (!tree.groups) {
//                         return;
//                     }
//                     for (var i=0; i<tree.groups.length; i++) {
//                         addCounts(tree.groups[i], counts);
//                     }
//                 }
//
//                 function normaliseScore (tree) {
//                     var max = 0;
//                     for (var i=0; i<tree.groups.length; i++) {
//                         var ta = tree.groups[i];
//                         if (max < ta.association_score) {
//                             max = ta.association_score;
//                         }
//                     }
//                     fixScore(tree, max);
//                 }
//
//                 function fixScore (tree, max) {
//                     tree.shared_targets = tree.association_score;
//                     tree.association_score = tree.association_score/max;
//                     tree.weight = tree.association_score;
//                     if (!tree.groups) {
//                         return;
//                     }
//                     for (var i=0; i<tree.groups.length; i++) {
//                         fixScore(tree.groups[i], max);
//                     }
//                 }
//
//                 // Given a flat structure of associations possibly with duplicates
//                 // based on a given field
//                 // return an object with unique associations
//                 // adding the number of times the given field has been seen
//                 // These counts have to be propagated up in the hierarchy based on the "path" attribute of each node
//                 function uniqueAssociations (arr) {
//                     var unique = {};
//                     for (var i=0; i<arr.length; i++) {
//                         var d = arr[i];
//
//                         // Propagate up
//                         var uniqueDiseasesInPath = getUniqueDiseasesFromPaths(d.disease.efo_info.path);
//                         for (var j=0; j<uniqueDiseasesInPath.length; j++) {
//                             addCount(unique, uniqueDiseasesInPath[j], {symbol: d.target.gene_info.symbol, id: d.target.id});
//                         }
//                     }
//                     // Remove the disease used as the entry point -- we want the expanded set of disease only
//                     return unique;
//                 }
//
//                 function getUniqueDiseasesFromPaths (paths) {
//                     // debugger;
//                     var u = {};
//                     for (var i=0; i<paths.length; i++) {
//                         var p = paths[i];
//                         for (var j=0; j<p.length; j++) {
//                             u[p[j]] = 1;
//                         }
//                     }
//                     var a = [];
//                     for (var id in u) {
//                         if (u.hasOwnProperty(id)) {
//                             a.push (id);
//                         }
//                     }
//                     return a;
//                 }
//
//                 function addCount (index, id, target) {
//                     if (!index[id]) {
//                         // index[id] = [];
//                         index[id] = {};
//                     }
//                     if (!index[id][target.symbol]) {
//                         index[id][target.symbol] = {
//                             count: 0,
//                             target: target
//                         };
//                     }
//                     index[id][target.symbol].count++;
//                     // index[id].push(target);
//                 }
//
//                 scope.width = angular.isDefined(scope.width) ? scope.width : 500; // set the default width
//                 scope.height = angular.isDefined(scope.height) ? scope.height : 500; // set the default height
//
//                 function drawFoamTree(data) {
//                     // need the timeout so the template can load and we have an id to use to display the foamtree
//                     $timeout( function() {
//                         foamtree = new CarrotSearchFoamTree({
//                             id: "foamtree",
//                             dataObject: data,
//                             // onGroupClick: scope.onCellSelect,
//                             rainbowStartColor: "hsla(0, 100%, 70%, 1)",
//                             rainbowEndColor:   "hsla(100, 100%, 70%, 1)",
//                             // groupMinDiameter: 0,
//                             // exposeDuration: 300,
//                             // groupLabelMinFontSize: 3,
//                             // parentFillOpacity: 0.5,
//                             // groupInsetWidth: 0,
//                             // groupSelectionOutlineWidth: 1,
//                             // groupBorderWidthScaling: 0.25,
//                             // rolloutDuration: 0,
//                             // pullbackDuration: 0,
//                             // groupBorderWidth : 0,
//                             // groupBorderRadius : 0,
//                             // relaxationInitializer : 'ordered',
//                             // onGroupDoubleClick: function(args) {
//                             //     scope.term = args.group.label;
//                             //     scope.breadcrumb = true;
//                             // }
//                         });
//                     }, 0);
//                 }
//             });
//         }
//     };
// }]);
