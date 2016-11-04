angular.module('cttvDirectives')

.directive ('multipleTargetsAssociationsSummary', ['$log', 'cttvAPIservice', '$q', function ($log, cttvAPIservice, $q) {
    'use strict';

    return {
        restrict: 'E',
        scope: {
            targets: "="
        },
        templateUrl: "partials/multiple-targets-associations-summary.html",
        link: function (scope, el, attrs) {
            scope.$watch('targets', function () {
                if (!scope.targets) {
                    return;
                }

                var associationsPromises = [];
                // 1st get the size
                var queryObjectForSize = {
                    method: 'POST',
                    params: {
                        "target": scope.targets,
                        "facets": false,
                        "size": 0,
                        "fields": "total"
                    }
                };
                cttvAPIservice.getAssociations(queryObjectForSize)
                    .then (function (resp) {
                        for (var i=0; i<resp.body.total; i+=1000) {
                            // Call to the api with the targets
                            var queryObject = {
                                method: 'POST',
                                params : {
                                    "target": scope.targets,
                                    "facets": true,
                                    "from": i,
                                    "size": 1000
                                }
                            };
                            associationsPromises.push(cttvAPIservice.getAssociations(queryObject));
                        }

                        $q.all(associationsPromises)
                            .then (function (resps) {
                                // facets are the same for all of them...
                                var combined = {
                                    facets : resps[0].body.facets,
                                    therapeutic_areas: resps[0].body.therapeutic_areas
                                };
                                var all = [];
                                for (var i=0; i<resps.length; i++) {
                                    all = _.concat (all, resps[i].body.data);
                                }
                                combined.data = all;
                                scope.associations = combined;
                            });
                    });


                // cttvAPIservice.getAssociations(queryObject)
                // .then (function (resp) {
                //     scope.associations = resp.body;
                // });

            });
        }
    };
}])

.directive ('multipleTargetsTas', ['$log', function ($log) {
    'use strict';

    return {
        restrict: 'E',
        scope: {
            associations: '=',
            targets: '='
        },
        templateUrl: "partials/multiple-targets-tas.html",
        link: function (scope, el, attrs) {
            scope.$watch('associations', function () {
                if (!scope.associations) {
                    return;
                }

                scope.targetsAssociationsLink = scope.targets.map(function (t) {return "target:"+t;}).join(',');

                var therapeuticAreas = scope.associations.facets.therapeutic_area.buckets;
                var tas = {};
                for (var j=0; j<therapeuticAreas.length; j++) {
                    tas[therapeuticAreas[j].label] = {
                        label: therapeuticAreas[j].label,
                        value: therapeuticAreas[j].unique_target_count.value,
                        diseases: {},
                        score: ~~(100 * therapeuticAreas[j].unique_target_count.value / scope.targets.length)
                    };
                }
                for (var i=0; i<scope.associations.data.length; i++) {
                    var association = scope.associations.data[i];
                    var target = association.target.gene_info.symbol;
                    var diseaseLabel = association.disease.efo_info.label;
                    var diseaseId = association.disease.id;
                    var tasForThisDisease = association.disease.efo_info.therapeutic_area.labels;
                    for (var k=0; k<tasForThisDisease.length; k++) {
                        // this check shoudn't be needed, but the api treats different "other diseases" in the facets and in the data
                        // "other diseases" vs "other"
                        if (tas[tasForThisDisease[k]]) {
                            if (!tas[tasForThisDisease[k]].diseases[diseaseLabel]) {
                                tas[tasForThisDisease[k]].diseases[diseaseLabel] = {
                                    id: diseaseId,
                                    label: diseaseLabel,
                                    value: 0,
                                    targets: []
                                };
                            }
                            tas[tasForThisDisease[k]].diseases[diseaseLabel].value++;
                            tas[tasForThisDisease[k]].diseases[diseaseLabel].score = 100 * tas[tasForThisDisease[k]].diseases[diseaseLabel].value / scope.targets.length;
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
            });
        }
    };
}])
.directive('multipleTargetsTable', ['$log', 'cttvUtils', function ($log, cttvUtils) {
    'use strict';

    function formatDiseaseDataToArray (diseases, targets) {
        var data = [];
        var diseaseArray = _.values(diseases); // Object.values is not supported in IE
        // diseaseArray.sort(function (a, b) {
        //     return a.score - b.score;
        // });
        for (var i=0; i<diseaseArray.length; i++) {
            var row = [];
            var d = diseaseArray[i];
            // 0 - Disease
            var targetsLink = "?targets=" + (targets.map(function (t) {return "target:"+t;}).join(','));
            var cell = "<a href='/disease/" + d.id + "/associations" + targetsLink + "'>" + d.disease + "</a>";
            row.push(cell);

            // 1 - Targets associated
            row.push(d.count);

            // 2 - Score (sum)
            // row.push(d.score);
            var score = 100 * d.count / targets.length;
            var bars = '<div style="position:relative;width:200px;height:20px">' +
            '<div style="width:100%;background:#eeeeee;height:100%;position:absolute;top:0px;left:0px"></div>' +
            '<div style="width:' + score + '%;background:#1e5799;height:100%;position:absolute;top:0px;left:0px"></div>' +
            '</div>';
            row.push(bars);

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
        templateUrl: 'partials/multiple-targets-table.html',
        scope: {
            associations: '=',
            targets: '='
        },
        link: function (scope, el, attrs) {
            scope.$watch('associations', function () {
                if (!scope.associations) {
                    return;
                }

                var data = scope.associations.data;
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
                            // "score": 0,  // sum of scores
                            "targets": []
                        };
                    }
                    diseases[disease].count++;
                    // diseases[disease].score += association.association_score.overall;
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


                // Create a table
                // format the data
                var table = $('#target-list-associated-diseases').DataTable( cttvUtils.setTableToolsParams({
                    "data": formatDiseaseDataToArray(diseases, scope.targets),
                    "ordering" : true,
                    "order": [[1, 'desc']],
                    "autoWidth": false,
                    "paging" : true,
                    "columnDefs" : []

                }, scope.targets.length + "-targets-associated_diseases") );
            });
        }
    };
}])
.directive('multipleTargetsBubbles', ['$log', 'cttvUtils', '$q', function ($log, cttvUtils, $q) {
    'use strict';

    return {
        restrict: 'E',
        templateUrl: "",
        scope: {
            // associations: '='
            targets: '=',
            associations: '='
        },
        link: function (scope, el, attrs) {
            // TODO: We are passing the "targets" to the expansionView
            // but we already have the associations that can be passed (and avoid the extra call to the api)
            scope.$watch('associations', function () {
                if (!scope.associations) {
                    return;
                }

                var container = document.createElement("div");
                el[0].appendChild(container);

                var dataPromise = $q(function (resolve) {
                    resolve({
                        "body": scope.associations
                    });
                });

                var targetListAssocBubbles = expansionView()
                    .data(dataPromise);
                    // .targets(scope.targets);
                targetListAssocBubbles (container);

            });

        }
    };
}]);
