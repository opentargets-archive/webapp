angular.module('otDirectives')

    .directive('multipleTargetsPathwaysSummary', ['$http', 'otUtils', 'otConsts', function ($http, otUtils, otConsts) {
        'use strict';

        function formatPathwayDataToArray (pathways, targets4pathways, symbol2id, bg) {
            var data = [];
            for (var i = 0; i < pathways.length; i++) {
                var p = pathways[i];
                var row = [];

                var pId = p.stId;
                var targetIds = [];
                var targets = targets4pathways[pId].map(function (t) {
                    targetIds.push(symbol2id[t.id]);
                    return t.id;
                });

                // 1. Pathway name
                // limit the length of the label
                var label = p.name;
                // if (label.length > 30) {
                //     label = label.substring(0, 30) + '...';
                // }
                var targetsInUrl = targets.map(function (t) {
                    return 'pathway-target=' + t;
                }).join('&');
                row.push('<a href=/summary?pathway=' + p.stId + '&' + targetsInUrl + ' title="' + label + '">' + label + '</a>');

                // 2. Enrichment
                row.push(p.entities.pValue.toPrecision(2));

                // 3. Number of targets -> bars
                var score = 100 * targets.length / bg.length;
                var bars = '<div style="position:relative;width:200px;height:20px">' +
                '<div style="width:100%;background:#eeeeee;height:100%;position:absolute;top:0px;left:0px"></div>' +
                '<div style="width:' + score + '%;background:#1e5799;height:100%;position:absolute;top:0px;left:0px"></div>' +
                '<div style="width:16px;border-radius:16px;text-align:center;vertical-align:middle;line-height:16px;font-size:0.8em;background:#eeeeee;position:absolute;top:2px;left:3px;color:#1e5799"><span>' + targets.length + '</span></div>' +
                '</div>';
                row.push(bars);


                // 4. Targets in pathway
                row.push(targets.join(', '));

                // 5 - Use this list
                // if (targetIds.length > 1) {
                //     var listUrl = '/summary?targets=' + otUtils.compressTargetIds(targetIds).join(',');
                //     row.push("<a href=" + listUrl + "><button class='bt bt-primary'>Use target list</button></a>");
                // } else {
                //     row.push('N/A');
                // }


                data.push(row);
            }
            return data;
        }

        return {
            restrict: 'E',
            templateUrl: 'src/components/multiple-targets/multiple-targets-pathways-summary.html',
            scope: {
                target: '='
            },
            link: function (scope) {
                scope.$watch('target', function () {
                    if (!scope.target) {
                        return;
                    }

                    // The real number of targets for which we have pathway information
                    var uniqueTargets = {};


                    // var pathways = {};
                    var symbol2id = {};
                    for (var i = 0; i < scope.target.length; i++) {
                        var t = scope.target[i];
                        var targetSymbol = t.approved_symbol;
                        symbol2id[targetSymbol] = t.ensembl_gene_id;

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
                    var preFlightUrl = otConsts.PROXY + 'www.reactome.org/AnalysisService/identifiers/projection?pageSize=1&page=1&resource=UNIPROT';
                    var postData = Object.keys(uniqueTargets).join('\n');
                    $http.post(preFlightUrl, postData)
                        .then(function (resp) {
                            return resp.data;
                        })
                        .then(function (data) {
                            var token = data.summary.token;
                            var nPathways = data.pathwaysFound;
                            var url = otConsts.PROXY + 'www.reactome.org/AnalysisService/token/' + token + '?pageSize=' + nPathways + '&page=1&resource=UNIPROT';
                            $http.get(url)
                                .then(function (resp) {
                                    var token = resp.data.summary.token;
                                    var url2 = otConsts.PROXY + 'www.reactome.org/AnalysisService/token/' + token + '/found/all';
                                    var postData2 = resp.data.pathways.map(function (d) {
                                        return d.stId;
                                    }).join(',');
                                    $http.post(url2, postData2)
                                        .then(function (targetPathways) {
                                            var targets4pathways = {};
                                            for (var i = 0; i < targetPathways.data.length; i++) {
                                                var pId = targetPathways.data[i].pathway;
                                                targets4pathways[pId] = targetPathways.data[i].entities;
                                            }
                                            if (resp.data.pathways) {
                                                scope.pathways = true; // flag to show the pathways section
                                            }
                                            // table
                                            $('#target-list-pathways').DataTable(otUtils.setTableToolsParams({
                                                'data': formatPathwayDataToArray(resp.data.pathways, targets4pathways, symbol2id, scope.target),
                                                'ordering': true,
                                                'order': [[1, 'asc']],
                                                'autoWidth': false,
                                                'paging': true,
                                                'columnDefs': []
                                            }, scope.target.length + '-targets-pathways'));
                                        });
                                });
                        });

                    scope.uniqueTargets = Object.keys(uniqueTargets).length;
                // scope.pathways = pathwaysArr;
                });
            }
        };
    }]);
