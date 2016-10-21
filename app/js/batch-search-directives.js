angular.module('cttvDirectives')

.directive ('targetListDisplay', ['$log', 'cttvAPIservice', 'cttvUtils', function ($log, cttvAPIservice, cttvUtils) {
    'use strict';

    function formatDiseaseDataToArray (diseases, listId) {
        var data = [];
        var diseaseArray = _.values(diseases); // Object.values is not supported in IE
        diseaseArray.sort(function (a, b) {
            return a.score - b.score;
        });
        for (var i=0; i<diseaseArray.length; i++) {
            var row = [];
            var d = diseaseArray[i];
            // 0 - Disease
            var cell = "<a href='/disease/" + d.id + "/associations?target-list=" + listId + "'>" + d.disease + "</a>";
            row.push(cell);

            // 1 - Targets associated
            row.push(d.count);

            // 2 - Score (sum)
            row.push(d.score);

            // 3 - Therapeutic areas
            var tas = Object.keys(d.tas).join("; ");
            row.push(tas); // therapeutic areas

            // Row complete
            data.push(row);
        }

        return data;
    }

    return {
        restrict: 'E',
        scope: {
            list: '='
        },
        templateUrl: "partials/target-list-display.html",
        link: function (scope, el, attrs) {
            scope.status = {}; // If the
            var table;
            scope.$watch('list', function (l) {
                if (!l) {
                    return;
                }

                // Make a rest api call to get all the associations for the list of targets
                var targets = {};
                var thisList = l.list;
                for (var i=0; i<thisList.length; i++) {
                    var thisSearch = thisList[i];
                    if (thisSearch.result.id) {
                        targets[thisSearch.result.id] = true;
                    }
                }

                $log.log("targets to retrive...");
                $log.log(targets);
                var opts = {
                    "target": Object.keys(targets),
                    // "direct": true,
                    "facets": false,
                    "size": 1000
                    // fields?
                };
                cttvAPIservice.getAssociations(opts, 'POST')
                    .then (function (resp) {
                        $log.log("associations response...");
                        $log.log(resp);
                        var data = resp.body.data;
                        var diseases = {};
                        var therapeuticAreas = {};
                        for (var i=0; i<data.length; i++) {
                            var association = data[i];
                            var target = association.target.gene_info.symbol;
                            var disease = association.disease.efo_info.label;
                            var efo = association.disease.id;
                            if (!diseases[disease]) {
                                diseases[disease] = {
                                    "disease": disease,
                                    "id": efo,
                                    "tas": {}, // therapeutic areas
                                    "count": 0, // just counts
                                    "score": 0,  // sum of scores
                                    "targets": []
                                };
                            }
                            diseases[disease].count++;
                            diseases[disease].score += association.association_score.overall;
                            diseases[disease].targets.push(target);
                            // Record the therapeutic areas
                            if (association.disease.efo_info.therapeutic_area.labels.length) {
                                for (var j=0; j<association.disease.efo_info.therapeutic_area.labels.length; j++) {
                                    therapeuticAreas[association.disease.efo_info.therapeutic_area.labels[j]] = true;
                                    diseases[disease].tas[association.disease.efo_info.therapeutic_area.labels[j]] = true;
                                }
                            } else {
                                therapeuticAreas[association.disease.efo_info.label] = true;
                            }
                        }

                        // $log.log("therapeutic areas...");
                        // $log.log(therapeuticAreas);
                        //
                        // $log.log("diseases...");
                        // $log.log(diseases);

                        // Destroy any previous table
                        if (table) {
                            table.destroy();
                        }

                        // Create a table
                        // format the data
                        table = $('#target-list-associated-diseases').DataTable( cttvUtils.setTableToolsParams({
                            "data": formatDiseaseDataToArray(diseases, l.id),
                            "ordering" : true,
                            "order": [[2, 'desc']],
                            "autoWidth": false,
                            "paging" : true,
                            "columnDefs" : []

                        }, l.id+"-associated_diseases") );

                    });
            });
        }
    };
}])

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
                $log.log("NEW LIST AVAILABLE!");
                $log.log(l);

                var thisList = l.list;
                scope.notFound = [];
                scope.exact = [];
                scope.fuzzy = [];

                for (var i=0; i<thisList.length; i++) {
                    var thisSearch = thisList[i];
                    if (thisSearch.result.approved_symbol) {
                        if (thisSearch.result.isExact) {
                            scope.exact.push({
                                query: thisSearch.query,
                                result: thisSearch.result.approved_symbol
                            });
                            // scope.exact++;
                        } else {
                            scope.fuzzy.push({
                                query: thisSearch.query,
                                result: thisSearch.result.approved_symbol
                            });
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
            });
        }
    };
}])

.directive ('targetListUpload', ['$log', 'cttvAPIservice', 'cttvLoadedLists', '$q', function ($log, cttvAPIservice, cttvLoadedLists, $q) {
    'use strict';

    function parseSearchResult (search, query) {
        var parsed = {};

        if (search) {
            $log.log(search);
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
                $log.log("use this list: " + listId);
                scope.list = cttvLoadedLists.get(listId);
            };
            scope.removeThisList = function (listId) {
                $log.log("remove this list: " + listId);
                scope.lists = cttvLoadedLists.remove(listId);
            };

            // In searches we store the searched term (target in the list) with its search promise
            scope.uploadFile = function () {

                var searches = {};
                $log.log("Uploading file!");
                var file = elem[0].getElementsByTagName("input")[0].files[0];
                var reader = new FileReader();
                reader.onloadend = function (e) {
                    var fileContent = e.target.result;
                    var targets = fileContent.split("\n");
                    $log.log(targets);

                    // Fire a search with each of the targets
                    var searchPromises = [];
                    targets.forEach(function (target) {
                        if (target) {
                            var p = cttvAPIservice.getSearch({
                                q:target,
                                size:1,
                                filter:"target"
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
                                        $log.log("pushing " + query);
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

                $log.log("active is " + scope.active);
                if (!scope.list || !scope.active) {
                    return;
                }
                $log.log('list is...');
                $log.log(scope.list);

                var container = document.createElement('div');
                elem[0].appendChild(container);

                var targetList = _.filter(_.map(scope.list.list, "result.id"));
                $log.log("targetList passed to foamtree");
                $log.log(targetList);

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
                        $log.log("flat tree for foamtree:");
                        $log.log(resp);
                    });

                scope.width = angular.isDefined(scope.width) ? scope.width : 500; // set the default width
                scope.height = angular.isDefined(scope.height) ? scope.height : 500; // set the default height

                scope.clusterData =  {
                    groups: [
                        { id: "1", label: "Group 1", groups: [
                            { id: "1.1", label: "Group 1.1" },
                            { id: "1.2", label: "Group 1.2" }
                        ]},
                        { id: "2", label: "Group 2", groups: [
                            { id: "2.1", label: "Group 2.1" },
                            { id: "2.2", label: "Group 2.2" }
                        ]},
                        { id: "3", label: "Group 3", groups: [
                            { id: "3.1", label: "Group 3.1" },
                            { id: "3.2", label: "Group 3.2" }
                        ]},
                        { id: "4", label: "Group 4", groups: [
                            { id: "4.1", label: "Group 4.1" },
                            { id: "4.2", label: "Group 4.2" }
                        ]},
                        { id: "5", label: "Group 5", groups: [
                            { id: "5.1", label: "Group 5.1" },
                            { id: "5.2", label: "Group 5.2" }
                        ]}
                    ]
                };

                function drawFoamTree() {
                    // need the timeout so the template can load and we have an id to use to display the foamtree
                    $timeout( function() {
                        foamtree = new CarrotSearchFoamTree({
                            id: "foamtree",
                            dataObject: scope.clusterData,
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
                drawFoamTree();
            });
        }
    };
}])
.directive ('targetListAssociationsBubbles', ['$log', function ($log) {
    'use strict';
    return {
        restrict: "E",
        template: "",
        scope: {
            list: "="
        },
        link: function (scope, elem, attrs) {
            scope.$watch('list', function (l) {
                if (!l) {
                    return;
                }
                var container = document.createElement("div");
                elem[0].appendChild(container);

                var targetList = _.filter(_.map(l.list, "result.id"));
                $log.log("target list passed to tlab");
                $log.log(targetList);

                var targetListAssocBubbles = expansionView()
                    .targets(targetList);
                targetListAssocBubbles (container);

            });

        }
    };
}]);
