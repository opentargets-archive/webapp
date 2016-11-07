angular.module('cttvDirectives')

.directive ('multipleTargetsPathwaysSummary', ['$log', 'cttvAPIservice', '$q', function ($log, cttvAPIservice, $q) {
    'use strict';

    return {
        restrict: 'E',
        templateUrl: 'partials/multiple-targets-pathways-summary.html',
        scope: {
            targets: "="
        },
        link: function (scope, el, attrs) {
            scope.$watch('targets', function () {
                if (!scope.targets) {
                    return;
                }

                var targetPromises = [];
                for (var i=0; i<scope.targets.length; i++) {
                    var target = scope.targets[i];
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
                        var pathways = {};
                        for (var i=0; i<resps.length; i++) {
                            var t = resps[i].body;
                            var targetSymbol = t.approved_symbol;
                            for (var j=0; j<t.reactome.length; j++) {
                                var p = t.reactome[j];
                                for (var k=0; k<p.value["pathway types"].length; k++) {
                                    var topLevelPathway = p.value["pathway types"][k]["pathway type name"];
                                    var topLevelPathwayId = p.value["pathway types"][k]["pathway type"];
                                    if (!pathways[topLevelPathway]) {
                                        pathways[topLevelPathway] = {
                                            targets: {},
                                            label: topLevelPathway,
                                            id: topLevelPathwayId,
                                            subPathways:{}
                                        };
                                    }
                                    if (!pathways[topLevelPathway].subPathways[p.value["pathway name"]]) {
                                        pathways[topLevelPathway].subPathways[p.value["pathway name"]] = {
                                            targets: {},
                                            label: p.value["pathway name"],
                                            id: p.id,
                                            link: "/summary?pathway=" + p.id
                                        };
                                    }
                                    pathways[topLevelPathway].targets[targetSymbol] = {
                                        symbol: targetSymbol
                                    };
                                    pathways[topLevelPathway].subPathways[p.value["pathway name"]].targets[targetSymbol] = {
                                        symbol: targetSymbol,
                                    };
                                }
                            }
                        }
                        var pathwaysArr = _.values(pathways);
                        for (var h=0; h<pathwaysArr.length; h++) {
                            pathwaysArr[h].targets = _.values(pathwaysArr[h].targets);
                            pathwaysArr[h].score = ~~(100 * pathwaysArr[h].targets.length / scope.targets.length);
                            pathwaysArr[h].subPathways = _.values(pathwaysArr[h].subPathways);
                            pathwaysArr[h].subPathways.sort (function (a, b) {
                                return b.targets.length - a.targets.length;
                            });
                            for (var h2=0; h2<pathwaysArr[h].subPathways.length; h2++) {
                                pathwaysArr[h].subPathways[h2].targets = Object.keys(pathwaysArr[h].subPathways[h2].targets);
                                pathwaysArr[h].subPathways[h2].score = ~~(100 * Object.keys(pathwaysArr[h].subPathways[h2].targets).length / scope.targets.length);
                                // Link to pathway summary page (including all the targets)
                                pathwaysArr[h].subPathways[h2].link += "&" + (pathwaysArr[h].subPathways[h2].targets.map(function (t) {return "pathway-target=" + t;})).join("&");
                            }
                        }
                        pathwaysArr.sort(function (a, b) {
                            return b.targets.length - a.targets.length;
                        });
                        scope.pathways = pathwaysArr;
                    });

            });
        }
    };
}]);
