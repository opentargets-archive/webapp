angular.module('cttvDirectives')

.directive ('multipleTargetsPathwaysSummary', ['$log', 'cttvAPIservice', '$http', '$q', 'cttvUtils', function ($log, cttvAPIservice, $http, $q, cttvUtils) {
    'use strict';

    function formatPathwayDataToArray(pathways, targets4pathways) {
        var data = [];
        for (var i=0; i<pathways.length; i++) {
            var p = pathways[i];
            var row = [];

            var pId = p.stId;
            var targets = targets4pathways[pId].map(function (t) {return t.id});

            // 1. Pathway name
            var targetsInUrl = targets.map(function (t) {return 'pathway-target=' + t}).join('&');
            row.push('<a href=/summary?pathway=' + p.stId + '&' + targetsInUrl + '>' + p.name + '</a>');

            // 2. Number of targets in this pathway
            row.push(p.entities.found);

            // 3. Enrichment
            row.push(p.entities.pValue.toPrecision(2));

            // 4. Number of targets -> bars
            row.push("");

            // 5. Targets in pathway
            row.push(targets.join(', '));

            data.push(row);
        }
        return data;
    }

    return {
        restrict: 'E',
        templateUrl: 'partials/multiple-targets-pathways-summary.html',
        scope: {
            target: "="
        },
        link: function (scope, el, attrs) {
            scope.$watch('target', function () {
                if (!scope.target) {
                    return;
                }

                // The real number of targets for which we have pathway information
                var uniqueTargets = {};


                // var pathways = {};
                for (var i = 0; i < scope.target.length; i++) {
                    var t = scope.target[i];
                    var targetSymbol = t.approved_symbol;
                    uniqueTargets[targetSymbol] = true;

                    // for (var j = 0; j < t.reactome.length; j++) {
                    //     var p = t.reactome[j];
                    //     for (var k = 0; k < p.value["pathway types"].length; k++) {
                            // var topLevelPathway = p.value["pathway types"][k]["pathway type name"];
                            // var topLevelPathwayId = p.value["pathway types"][k]["pathway type"];
                            // if (!pathways[topLevelPathway]) {
                            //     pathways[topLevelPathway] = {
                            //         targets: {},
                            //         label: topLevelPathway,
                            //         id: topLevelPathwayId,
                            //         subPathways: {}
                            //     };
                            // }
                            // if (!pathways[topLevelPathway].subPathways[p.value["pathway name"]]) {
                            //     pathways[topLevelPathway].subPathways[p.value["pathway name"]] = {
                            //         targets: {},
                            //         label: p.value["pathway name"],
                            //         id: p.id,
                            //         link: "/summary?pathway=" + p.id
                            //     };
                            // }
                            // uniqueTargets[targetSymbol] = true;
                            // pathways[topLevelPathway].targets[targetSymbol] = {
                            //     symbol: targetSymbol
                            // };
                            // pathways[topLevelPathway].subPathways[p.value["pathway name"]].targets[targetSymbol] = {
                            //     symbol: targetSymbol
                            // };
                    //     }
                    // }
                }
                // var pathwaysArr = _.values(pathways);
                // for (var h = 0; h < pathwaysArr.length; h++) {
                //     pathwaysArr[h].targets = _.values(pathwaysArr[h].targets);
                //     pathwaysArr[h].score = ~~(100 * pathwaysArr[h].targets.length / scope.target.length);
                //     pathwaysArr[h].subPathways = _.values(pathwaysArr[h].subPathways);
                //     pathwaysArr[h].subPathways.sort(function (a, b) {
                //         return b.targets.length - a.targets.length;
                //     });
                //     for (var h2 = 0; h2 < pathwaysArr[h].subPathways.length; h2++) {
                //         pathwaysArr[h].subPathways[h2].targets = Object.keys(pathwaysArr[h].subPathways[h2].targets);
                //         pathwaysArr[h].subPathways[h2].score = ~~(100 * Object.keys(pathwaysArr[h].subPathways[h2].targets).length / scope.target.length);
                //         // Link to pathway summary page (including all the targets)
                //         pathwaysArr[h].subPathways[h2].link += "&" + (pathwaysArr[h].subPathways[h2].targets.map(function (t) {
                //                 return "pathway-target=" + t;
                //             })).join("&");
                //     }
                // }
                // pathwaysArr.sort(function (a, b) {
                //     return b.targets.length - a.targets.length;
                // });

                // Get enrichment analysis from reactome
                // http://www.reactome.org/AnalysisService/identifiers/projection/\?pageSize\=1\&page\=1 POST
                var preFlightUrl = '/proxy/www.reactome.org/AnalysisService/identifiers/projection?pageSize=1&page=1&resource=UNIPROT';
                var postData = Object.keys(uniqueTargets).join('\n');
                $http.post(preFlightUrl, postData)
                    .then (function (resp) {
                        return resp.data;
                    })
                    .then (function (data) {
                        var token = data.summary.token;
                        var nPathways = data.pathwaysFound;
                        var url = '/proxy/www.reactome.org/AnalysisService/token/' + token + '?pageSize=' + nPathways + '&page=1&resource=UNIPROT';
                        $http.get(url)
                            .then (function (resp) {
                                var token = resp.data.summary.token;
                                var url2 = '/proxy/www.reactome.org/AnalysisService/token/' + token + '/found/all';
                                var postData2 = resp.data.pathways.map(function (d) {
                                    return d.stId;
                                }).join(",");
                                $http.post(url2, postData2)
                                    .then (function (targetPathways) {
                                        var targets4pathways = {};
                                        for (var i=0; i<targetPathways.data.length; i++) {
                                            var pId = targetPathways.data[i].pathway;
                                            targets4pathways[pId] = targetPathways.data[i].entities;
                                        }
                                        if (resp.data.pathways) {
                                            scope.pathways = true; // flag to show the pathways section
                                        }
                                        // table
                                        $('#target-list-pathways').DataTable(cttvUtils.setTableToolsParams({
                                            "data": formatPathwayDataToArray(resp.data.pathways, targets4pathways),
                                            "ordering": true,
                                            "order": [[2, "asc"]],
                                            "autoWidth": false,
                                            "paging": true,
                                            "columnDefs": []
                                        }, scope.target.length + "-targets-pathways"));
                                    });
                            });
                    });

                scope.uniqueTargets = Object.keys(uniqueTargets).length;
                // scope.pathways = pathwaysArr;
            });
        }
    };
}]);
