angular.module('cttvDirectives')

.directive ('targetListDisplay', ['$log', 'cttvAPIservice', 'cttvUtils', '$http', '$q', 'cttvConfig', function ($log, cttvAPIservice, cttvUtils, $http, $q, cttvConfig) {
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
                        targets[thisSearch.result.id] = thisSearch.result;
                    }
                }

                var queryObject = {
                    method: 'POST',
                    params : {
                        "target": Object.keys(targets),
                        "facets": true,
                        "size": 1000
                        // fields?
                    }
                };
                cttvAPIservice.getAssociations(queryObject)
                    .then (function (resp) {
                        diseasesByTA(resp, Object.keys(targets).length);
                        pathways(Object.keys(targets));
                        drugs(Object.keys(targets));
                        tissues(_.values(targets));
                        var data = resp.body.data;
                        var diseases = {};
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
                                    // therapeuticAreas[association.disease.efo_info.therapeutic_area.labels[j]] = true;
                                    diseases[disease].tas[association.disease.efo_info.therapeutic_area.labels[j]] = true;
                                }
                            } else {
                                // therapeuticAreas[association.disease.efo_info.label] = true;
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

            // Tissues expression
            var tissuesOrdered = [
                "Adipose",
                "Adrenal Gland",
                "Bladder",
                "Brain",
                "Breast",
                "Cells",
                "Cervix",
                "Colon",
                "Esophagus",
                "Fallopian Tube",
                "Heart",
                "Kidney",
                "Liver",
                "Lung",
                "Minor Salivary Gland",
                "Muscle",
                "Nerve",
                "Ovary",
                "Pancreas",
                "Pituitary",
                "Prostate",
                "Skin",
                "Small Intestine",
                "Spleen",
                "Stomach",
                "Testis",
                "Thyroid",
                "Uterus",
                "Vagina",
                "Whole Blood"
            ];

            var tissuesTableCols = [
                {name:"", title:""}, // first one empty
                {name:"", title:"Target"}
            ];

            for (var z=0; z<tissuesOrdered.length; z++) {
                tissuesTableCols.push({
                    name: tissuesOrdered[z],
                    title: tissuesOrdered[z]
                });
            }
            tissuesTableCols.push({name:"",title:""}); // last one empty

            var colorScale = cttvUtils.colorScales.BLUE_0_1;
            var getColorStyleString = function (value) {
                var str = "";
                if (value <= 0) {
                    str = "<span class='no-data' title='No data'></span>"; // quick hack: where there's no data, don't put anything so the sorting works better
                } else {
                    var col = colorScale(value);
                    var val = (value === 0) ? "0" : cttvUtils.floatPrettyPrint(value);
                    str = "<span style='color: " + col + "; background: " + col + ";' title='Score: " + val + "'>" + val + "</span>";
                }

                return str;
            };

            //setup the table
            var setupTissuesTable = function (table, data, filename) {
                $(table).DataTable({
                    "dom": '<"clearfix" <"clear small" i><"pull-left small" f><"pull-right"<"#cttvTableDownloadIcon">>rt<"pull-left small" l><"pull-right small" p>>',
                    "data": data,
                    "columns": (function(){
                        var a=[];
                        for(var i=0; i<tissuesTableCols.length; i++){
                            a.push({ "title": "<div><span title='"+tissuesTableCols[i].title+"'>"+tissuesTableCols[i].title+"</span></div>", "name":tissuesTableCols[i].name });
                        }
                        return a;
                    })(),
                    "order": [],
                    "orderMulti": true,
                    "autoWidth": false,
                    "columnDefs" : [
                        {
                            "targets" : [0,32],
                            "orderable": false
                        },
                    ],
                    "ordering": true,
                    "lengthMenu": [[20, 100, 500], [20, 100, 500]],
                    "pageLength": 20,
                    "language": {
                        // "lengthMenu": "Display _MENU_ records per page",
                        // "zeroRecords": "Nothing found - sorry",
                        "info": "Showing _START_ to _END_ of _TOTAL_ shared targets",
                        // "infoEmpty": "No records available",
                        // "infoFiltered": "(filtered from _MAX_ total records)"
                    }

                }, filename);
            };


            function parseTissuesData (tissuesData) {
                // var txt = tissuesPerTarget(tissues);
                $log.log("tissuesPerTarget");
                $log.log(tissuesData);
                var newData = [];
                for (var target in tissuesData) {
                    // var row = [];
                    var row = [""]; // First one empty
                    // Target
                    row.push(target);
                    for (var i=0; i<tissuesOrdered.length; i++) {
                        var tissue = tissuesOrdered[i];
                        // Each Tissue
                        // row.push(tissuesData[target][tissue].maxMedian);
                        row.push(getColorStyleString(tissuesData[target][tissue].maxMedian));
                    }
                    row.push(""); // last one empty
                    newData.push(row);
                }
                $log.log("row data");
                $log.log(newData);
                return newData;
            }

            function tissues (targets) {
                $log.log("targets for tissues...");
                $log.log(targets);
                var gtexPromises = [];
                var baseGtexUrlPrefix = "/proxy/gtexportal.org/api/v6p/expression/";
                var baseGtexUrlSufix = "?boxplot=true";
                var mapUrl = {};
                for (var i=0; i<targets.length; i++) {
                    var url = baseGtexUrlPrefix + targets[i].approved_symbol + baseGtexUrlSufix;
                    $log.warn(url);
                    mapUrl[url] = targets[i];
                    gtexPromises.push($http.get(url));
                }
                $q.all(gtexPromises)
                    .then (function (resps) {
                        $log.log("gtex responses...");
                        $log.log(resps);
                        var tissuesData = {};
                        var maxVal = 0;
                        for (var i=0; i<resps.length; i++) {
                            var tissues = {};
                            var target = mapUrl[resps[i].config.url];
                            for (var fullTissue in resps[i].data.generpkm) {
                                var d = resps[i].data.generpkm[fullTissue];
                                var median = d.median;
                                var tissue = fullTissue.split(" - ")[0];
                                if (!tissues[tissue]) {
                                    tissues[tissue] = {
                                        target: target,
                                        tissue: tissue,
                                        maxMedian: 0
                                    };
                                }
                                if (median > tissues[tissue].maxMedian) {
                                    tissues[tissue].maxMedian = median;
                                }
                                if (median > maxVal) {
                                    maxVal = median;
                                }
                            }
                            $log.log("tissues object...");
                            $log.log(tissues);
                            // var tissuesData = parseTissuesData(_.values(tissues));
                            tissuesData[target.approved_symbol] = tissues;
                        }
                        colorScale.domain([0, maxVal]);
                        $log.log("tissues data for table...");
                        $log.log(tissuesData);
                        var tissueDataRows = parseTissuesData(tissuesData);
                        $log.log("tissue data rows");
                        $log.log(tissueDataRows);
                        var table = document.getElementById("tissuesSummaryTargetList");
                        table.innerHTML = "";
                        setupTissuesTable(table, tissueDataRows, "gtex-data-gene-list.txt");
                    });
            }

            function diseasesByTA (resp, nTargets) {
                var therapeuticAreas = resp.body.facets.therapeutic_area.buckets;
                var tas = {};
                for (var j=0; j<therapeuticAreas.length; j++) {
                    tas[therapeuticAreas[j].label] = {
                        label: therapeuticAreas[j].label,
                        value: therapeuticAreas[j].unique_target_count.value,
                        diseases: {},
                        score: 100 * therapeuticAreas[j].unique_target_count.value / nTargets
                    };
                }
                for (var i=0; i<resp.body.data.length; i++) {
                    var association = resp.body.data[i];
                    var target = association.target.gene_info.symbol;
                    var diseaseLabel = association.disease.efo_info.label;
                    var tasForThisDisease = association.disease.efo_info.therapeutic_area.labels;
                    for (var k=0; k<tasForThisDisease.length; k++) {
                        // this check shoudn't be needed, but the api treats different "other diseases" in the facets and in the data
                        // "other diseases" vs "other"
                        if (tas[tasForThisDisease[k]]) {
                            if (!tas[tasForThisDisease[k]].diseases[diseaseLabel]) {
                                tas[tasForThisDisease[k]].diseases[diseaseLabel] = {
                                    label: diseaseLabel,
                                    value: 0,
                                    targets: []
                                };
                            }
                            tas[tasForThisDisease[k]].diseases[diseaseLabel].value++;
                            tas[tasForThisDisease[k]].diseases[diseaseLabel].score = 100 * tas[tasForThisDisease[k]].diseases[diseaseLabel].value / nTargets;
                            tas[tasForThisDisease[k]].diseases[diseaseLabel].targets.push(target);
                        }
                    }
                }
                // sort tas by number of targets (value);
                var tasArr = _.values(tas);
                tasArr.sort(function (a, b) {
                    return b.value - a.value;
                });
                for (var z=0; z<tasArr.length; z++) {
                    var diseasesArr = _.values(tasArr[z].diseases);
                    diseasesArr.sort (function (a, b) {
                        return b.value - a.value;
                    });
                    tasArr[z].diseases = diseasesArr;
                }
                scope.therapeuticAreas = tasArr;
            }

            function drugs (targets) {
                var queryObject = {
                    method: 'POST',
                    trackCall: false,
                    params: {
                        target: targets,
                        size: 1000,
                        datasource: cttvConfig.evidence_sources.known_drug,
                        fields: [
                            "disease.efo_info",
                            "drug",
                            "evidence",
                            "target",
                            "access_level"
                        ]
                    }
                };
                cttvAPIservice.getFilterBy(queryObject)
                    .then (function (resp) {
                        $log.log("filter by response...");
                        $log.log(resp);
                        var drugs = {};
                        for (var i=0; i<resp.body.data.length; i++) {
                            var ev = resp.body.data[i];
                            var target = ev.target.gene_info.symbol;
                            var drug = ev.drug.molecule_name;
                            if (!drugs[target]) {
                                drugs[target] = {
                                    target: target,
                                    drugs: []
                                };
                            }
                            drugs[target].drugs[drug] = drug;
                        }
                        var drugsArr = _.values(drugs);
                        for (var j=0; j<drugsArr.length; j++) {
                            drugsArr[j].drugs = _.values(drugsArr[j].drugs);
                        }
                        $log.log("drugs array");
                        $log.log(drugsArr);
                        scope.drugs = drugsArr;
                    });
            }

            function pathways (targets) {
                var targetPromises = [];
                for (var i=0; i<targets.length; i++) {
                    var target = targets[i];
                    $log.log("getting info for target " + target);
                    (function (target) {
                        targetPromises.push(cttvAPIservice.getTarget({
                            method: "GET",
                            trackCall: false,
                            params: {
                                "target_id": target
                            }
                        }));
                    })(target);
                }

                $q.all(targetPromises)
                    .then (function (resps) {
                        $log.log("target promises response...");
                        $log.log(resps);
                        var pathways = {};
                        for (var i=0; i<resps.length; i++) {
                            var t = resps[i].body;
                            var targetSymbol = t.approved_symbol;
                            $log.log("reactome pathways...");
                            $log.log(t.reactome);
                            for (var j=0; j<t.reactome.length; j++) {
                                var p = t.reactome[j];
                                for (var k=0; k<p.value["pathway types"].length; k++) {
                                    var topLevelPathway = p.value["pathway types"][k]["pathway type name"];
                                    if (!pathways[topLevelPathway]) {
                                        pathways[topLevelPathway] = {
                                            targets: {},
                                            label: topLevelPathway
                                        };
                                    }
                                    pathways[topLevelPathway].targets[targetSymbol] = {
                                        symbol: targetSymbol
                                    };
                                }
                            }
                        }
                        $log.log("pathways read...");
                        $log.log(pathways);
                        var pathwaysArr = _.values(pathways);
                        for (var h=0; h<pathwaysArr.length; h++) {
                            pathwaysArr[h].targets = _.values(pathwaysArr[h].targets);
                            pathwaysArr[h].score = 100 * pathwaysArr[h].targets.length / targets.length;
                        }
                        pathwaysArr.sort(function (a, b) {
                            return b.targets.length - a.targets.length;
                        });
                        $log.log("pathways array...");
                        $log.log(pathwaysArr);
                        scope.pathways = pathwaysArr;
                    });
            }
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
                                method: 'GET',
                                opts: {
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
                        var dataObject = processData (resp.body);
                        $log.log("tree processed to pass to foamtree...");
                        $log.log(dataObject);
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
