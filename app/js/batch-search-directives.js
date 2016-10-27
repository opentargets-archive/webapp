angular.module('cttvDirectives')


.directive ('targetListMapping', ['$log', '$sce', 'cttvLoadedLists', function ($log, $sce, cttvLoadedLists) {
    'use strict';

    return {
        restrict: 'E',
        scope: {
            list: '='
        },
        templateUrl: "partials/target-list-mapping.html",
        link: function (scope, el, attrs) {
            scope.$watch('list', function (l) {
                if (!l) {
                    return;
                }

                var thisList = l.list;
                scope.notFound = [];
                scope.exact = [];
                scope.fuzzy = [];

                var targetIds = [];

                for (var i=0; i<thisList.length; i++) {
                    var thisSearch = thisList[i];
                    if (thisSearch.result.approved_symbol) {
                        if (thisSearch.result.isExact) {
                            scope.exact.push({
                                query: thisSearch.query,
                                result: thisSearch.result.approved_symbol
                            });
                            targetIds.push(thisSearch.result.id);
                            // scope.exact++;
                        } else {
                            scope.fuzzy.push({
                                query: thisSearch.query,
                                result: thisSearch.result.approved_symbol
                            });
                            targetIds.push(thisSearch.result.id);
                            // scope.fuzzy++;
                        }

                    } else {
                        scope.notFound.push({
                            query: thisSearch.query,
                            result: "?"
                        });
                        // scope.notFound++;
                    }
                }

                if (targetIds.length) {
                    scope.summaryLink = "/summary?" + (targetIds.map(function (t) {return "target=" + t;}).join("&"));
                }
            });
        }
    };
}])

.directive ('targetListUpload', ['$log', 'cttvAPIservice', 'cttvLoadedLists', '$q', function ($log, cttvAPIservice, cttvLoadedLists, $q) {
    'use strict';

    function parseSearchResult (search, query) {
        var parsed = {};

        if (search) {
            parsed.approved_symbol = search.data.approved_symbol;
            parsed.approved_name = search.data.approved_name;
            parsed.id = search.data.id;
            parsed.isExact = false;

            // Determine fuzzy / exact match
            var highlight;
            if (search.highlight.approved_symbol) {
                highlight = search.highlight.approved_symbol[0];
            } else if (search.highlight) {
                highlight = search.highlight.ensembl_gene_id[0];
            }

            var parser = new DOMParser();
            var doc = parser.parseFromString(highlight, 'text/xml');
            var matchedText = doc.firstChild.textContent;
            if ((query === matchedText) || (query === parsed.id)) {
                parsed.isExact = true;
            }
        }

        return parsed;
    }

    // cttvLoadedLists.clear();

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

            // In searches we store the searched term (target in the list) with its search promise
            scope.uploadFile = function () {

                var searches = {};
                var file = elem[0].getElementsByTagName("input")[0].files[0];
                var reader = new FileReader();
                reader.onloadend = function (e) {
                    var fileContent = e.target.result;
                    var targets = fileContent.split("\n");

                    // Fire a search with each of the targets
                    var searchPromises = [];
                    targets.forEach(function (target) {
                        if (target) {
                            var p = cttvAPIservice.getSearch({
                                method: 'GET',
                                params: {
                                    q:target,
                                    size:1,
                                    filter:"target"
                                }
                            });
                            // Associate target names with its search promise
                            // so we can associate them later to feedback the user
                            searches[target] = p;
                            searchPromises.push(p);
                        }
                    });

                    var listSearch = [];
                    $q.all(searchPromises)
                    .then (function (vals) {
                        for (var search in searches) {
                            var searchPromise = searches[search];
                            (function (query) {
                                // These promises have been already resolved previously, so execution is sequential now
                                searchPromise
                                    .then (function (searchResult) {
                                        listSearch.push({
                                            query: query,
                                            result: parseSearchResult(searchResult.body.data[0], query)
                                        });
                                    });
                            })(search);
                        }
                    })
                    .then (function () {
                        // clean & update lists in localStorage
                        cttvLoadedLists.add(file.name, listSearch);
                        scope.list = cttvLoadedLists.get(file.name);
                    });
                };
                reader.readAsText(file);
            };
        }
    };
}])

.directive ('targetListAssociationsFoamtree', ['$log', '$timeout', 'cttvAPIservice', function ($log, $timeout, cttvAPIservice) {
    'use strict';
    return {
        restrict: 'E',
        template: '<div id="foamtree" style="width: {{width}}px; height: {{height}}px"></div>',
        scope: {
            list: '=',
            active: '='
        },
        link: function (scope, elem, attrs) {
            scope.$watchGroup(['list', 'active'], function () {
                var foamtree = {};

                if (!scope.list || !scope.active) {
                    return;
                }

                var container = document.createElement('div');
                elem[0].appendChild(container);

                var targetList = _.filter(_.map(scope.list.list, "result.id"));

                var queryObject = {
                    method: 'POST',
                    params: {
                        target: targetList,
                        outputstructure: "flat",
                        size: 1000,
                        facets: false
                    }
                };
                cttvAPIservice.getAssociations(queryObject)
                    .then (function (resp) {
                        var dataObject = processData (resp.body);
                        drawFoamTree(dataObject);
                    });


                function processData (body) {
                    var diseaseCounts = uniqueAssociations(body.data);
                    body.childrenProperty = "groups";
                    var tree = cttvAPIservice.getSelf().utils.flat2tree(body);
                    addCounts(tree, diseaseCounts);
                    normaliseScore(tree);
                    return tree;
                }

                // Given a tree structure and a disease this function add the counts to each node in the tree
                function addCounts (tree, counts) {
                    tree.association_score = counts[tree.__id] ? Object.keys(counts[tree.__id]).length : 0;
                    tree.shared_targets_symbols = counts[tree.__id];
                    if (!tree.groups) {
                        return;
                    }
                    for (var i=0; i<tree.groups.length; i++) {
                        addCounts(tree.groups[i], counts);
                    }
                }

                function normaliseScore (tree) {
                    var max = 0;
                    for (var i=0; i<tree.groups.length; i++) {
                        var ta = tree.groups[i];
                        if (max < ta.association_score) {
                            max = ta.association_score;
                        }
                    }
                    fixScore(tree, max);
                }

                function fixScore (tree, max) {
                    tree.shared_targets = tree.association_score;
                    tree.association_score = tree.association_score/max;
                    tree.weight = tree.association_score;
                    if (!tree.groups) {
                        return;
                    }
                    for (var i=0; i<tree.groups.length; i++) {
                        fixScore(tree.groups[i], max);
                    }
                }

                // Given a flat structure of associations possibly with duplicates
                // based on a given field
                // return an object with unique associations
                // adding the number of times the given field has been seen
                // These counts have to be propagated up in the hierarchy based on the "path" attribute of each node
                function uniqueAssociations (arr) {
                    var unique = {};
                    for (var i=0; i<arr.length; i++) {
                        var d = arr[i];

                        // Propagate up
                        var uniqueDiseasesInPath = getUniqueDiseasesFromPaths(d.disease.efo_info.path);
                        for (var j=0; j<uniqueDiseasesInPath.length; j++) {
                            addCount(unique, uniqueDiseasesInPath[j], {symbol: d.target.gene_info.symbol, id: d.target.id});
                        }
                    }
                    // Remove the disease used as the entry point -- we want the expanded set of disease only
                    return unique;
                }

                function getUniqueDiseasesFromPaths (paths) {
                    // debugger;
                    var u = {};
                    for (var i=0; i<paths.length; i++) {
                        var p = paths[i];
                        for (var j=0; j<p.length; j++) {
                            u[p[j]] = 1;
                        }
                    }
                    var a = [];
                    for (var id in u) {
                        if (u.hasOwnProperty(id)) {
                            a.push (id);
                        }
                    }
                    return a;
                }

                function addCount (index, id, target) {
                    if (!index[id]) {
                        // index[id] = [];
                        index[id] = {};
                    }
                    if (!index[id][target.symbol]) {
                        index[id][target.symbol] = {
                            count: 0,
                            target: target
                        };
                    }
                    index[id][target.symbol].count++;
                    // index[id].push(target);
                }

                scope.width = angular.isDefined(scope.width) ? scope.width : 500; // set the default width
                scope.height = angular.isDefined(scope.height) ? scope.height : 500; // set the default height

                function drawFoamTree(data) {
                    // need the timeout so the template can load and we have an id to use to display the foamtree
                    $timeout( function() {
                        foamtree = new CarrotSearchFoamTree({
                            id: "foamtree",
                            dataObject: data,
                            // onGroupClick: scope.onCellSelect,
                            rainbowStartColor: "hsla(0, 100%, 70%, 1)",
                            rainbowEndColor:   "hsla(100, 100%, 70%, 1)",
                            // groupMinDiameter: 0,
                            // exposeDuration: 300,
                            // groupLabelMinFontSize: 3,
                            // parentFillOpacity: 0.5,
                            // groupInsetWidth: 0,
                            // groupSelectionOutlineWidth: 1,
                            // groupBorderWidthScaling: 0.25,
                            // rolloutDuration: 0,
                            // pullbackDuration: 0,
                            // groupBorderWidth : 0,
                            // groupBorderRadius : 0,
                            // relaxationInitializer : 'ordered',
                            // onGroupDoubleClick: function(args) {
                            //     scope.term = args.group.label;
                            //     scope.breadcrumb = true;
                            // }
                        });
                    }, 0);
                }
            });
        }
    };
}]);
