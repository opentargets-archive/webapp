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
                        var pathwaysArr = _.values(pathways);
                        for (var h=0; h<pathwaysArr.length; h++) {
                            pathwaysArr[h].targets = _.values(pathwaysArr[h].targets);
                            pathwaysArr[h].score = 100 * pathwaysArr[h].targets.length / scope.targets.length;
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
