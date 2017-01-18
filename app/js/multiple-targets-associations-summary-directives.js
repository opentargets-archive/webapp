angular.module('cttvDirectives')

.directive ('multipleTargetsAssociationsSummary', ['$log', 'cttvAPIservice', '$q', function ($log, cttvAPIservice, $q) {
    'use strict';

    return {
        restrict: 'E',
        scope: {
            targets: "=",
            associations: '='
        },
        templateUrl: "partials/multiple-targets-associations-summary.html"
        // link: function (scope, el, attrs) {
        // }
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

                scope.targetsAssociationsLink = scope.targets.map(function (t) {
                    return "target:"+t;
                }).join(',');

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

    function parseEnrichment (enrArr) {
        var enrObj = {};
        for (var i=0; i<enrArr.length; i++) {
            var thisEnr = enrArr[i];
            var id = thisEnr.id;
            enrObj[id] = thisEnr.score;
        }
        return enrObj;
    }

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
            var targetsLink = "?targets=" + (targets.map(function (t) {return "target:"+t.ensembl_gene_id;}).join(','));
            var cell = "<a href='/disease/" + d.id + "/associations" + targetsLink + "'>" + d.disease + "</a>";
            row.push(cell);

            // 1 - Targets associated
            row.push(d.count);

            // 2 - Enrichment
            if (d.enrichment) {
                row.push(d.enrichment.toPrecision(1));
            } else {
                row.push('NA');
            }

            // 3 - Score (sum)
            // row.push(d.score);
            var score = 100 * d.count / targets.length;
            var bars = '<div style="position:relative;width:200px;height:20px">' +
            '<div style="width:100%;background:#eeeeee;height:100%;position:absolute;top:0px;left:0px"></div>' +
            '<div style="width:' + score + '%;background:#1e5799;height:100%;position:absolute;top:0px;left:0px"></div>' +
            '</div>';
            row.push(bars);

            // 4 - Therapeutic areas
            var tas = Object.keys(d.tas).join("; ");
            row.push(tas); // therapeutic areas

            // 5 - targets
            // showing the most associated 5 targets
            var targetsAssoc = d.targets.sort(function (t1, t2) {
                return t2.score - t1.score;
            });
            var url = '';
            for (var j=0; j<5; j++) {
                var t = targetsAssoc[j];
                if (t) {
                    url += '<a href=/evidence/' + t.id + '/' + d.id + '>' + t.target + '</a> ';
                }
            }
            if (targetsAssoc.length > 5) {
                url += "...";
            }
            // row.push(_.take(_.map(targetsAssoc, 'target'), 5).join(", "));
            row.push(url);

            // Row complete
            data.push(row);
        }

        return data;
    }

    var table; // The datatable table

    return {
        restrict: 'E',
        templateUrl: 'partials/multiple-targets-table.html',
        scope: {
            associations: '=',
            targets: '='
        },
        link: function (scope, el, attrs) {
            scope.selectedTA = '';
            scope.selectTA = function(ta) {
                if (scope.selectedTA === ta.label) {
                    scope.selectedTA = '';
                } else {
                    scope.selectedTA = ta.label;
                }
                table.draw();
            };

            scope.$watch('associations', function () {
                if (!scope.associations) {
                    return;
                }

                // Compile the therapeutic areas...
                var therapeuticAreas = scope.associations.facets.therapeutic_area.buckets;
                // var tas = {};
                var tas = [];
                for (var k=0; k<therapeuticAreas.length; k++) {
                    var ta = therapeuticAreas[k];
                    tas.push({
                        label: ta.label,
                        value: ta.unique_target_count.value,
                        score: (ta.unique_target_count.value / scope.targets.length).toPrecision(1)
                    });
                    // tas[ta.label] = {
                    //     label: ta.label,
                    //     value: ta.unique_target_count.value,
                    //     score: (ta.unique_target_count.value / scope.targets.length).toPrecision(1)
                    // }
                }
                scope.therapeuticAreas = tas;

                // Compile enrichment
                var enrichment = parseEnrichment(scope.associations.enrichment);

                // diseases in the table
                var data = scope.associations.data;
                var diseases = {};
                for (var i=0; i<data.length; i++) {
                    var association = data[i];
                    var target = association.target.gene_info.symbol;
                    var targetEnsId = association.target.id;
                    // var target = association.target;
                    // target.association_score = association.association_score.overall;
                    var disease = association.disease.efo_info.label;
                    var efo = association.disease.id;
                    if (!diseases[disease]) {
                        diseases[disease] = {
                            "disease": disease,
                            "id": efo,
                            "tas": {}, // therapeutic areas
                            "count": 0, // just counts
                            // "score": 0,  // sum of scores
                            "targets": [],
                            "enrichment": enrichment[efo]
                        };
                    }
                    diseases[disease].count++;

                    // diseases[disease].score += association.association_score.overall;
                    diseases[disease].targets.push({
                        target: target,
                        id: targetEnsId,
                        score: association.association_score.overall
                    });

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
                // Filter based on Therapeutic area...
                $.fn.dataTable.ext.search.push(
                    function (settings, data, dataIndex) {
                        if (!scope.selectedTA) {
                            return true;
                        }
                        var disease = data[0];
                        var tas = data[4];
                        return ((disease === scope.selectedTA) || (tas.indexOf(scope.selectedTA) >= 0))
                    }
                );

                // format the data
                // decide if the table sorts by number of targets or enrichment
                var order;
                if (scope.targets.length >= 10) {
                    order = [[2, 'asc']];
                } else {
                    order = [[1, 'desc']];
                }
                table = $('#target-list-associated-diseases').DataTable( cttvUtils.setTableToolsParams({
                    "data": formatDiseaseDataToArray(diseases, scope.targets),
                    "ordering" : true,
                    "order": order,
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
}])

.directive ('percPiechart', ['$log', '$timeout', function ($log, $timeout) {
    'use strict';
     return {
         restrict: 'E',
         template: '',
         scope: {
             score: '=' // [0,1]
         },
         link: function (scope, el, attrs) {
             scope.radius = 20;

             scope.$watch('score', function () {
                 if (!scope.score) {
                     return;
                 }

                 $timeout (function () {
                     var svg_g = d3.select(el[0])
                         .append("svg")
                         .attr("width", scope.radius)
                         .attr("height", scope.radius)
                         .append("g")
                         .attr("transform", "translate(" + ~~scope.radius/2 + "," + ~~scope.radius/2 + ")");

                     var arc = d3.svg.arc()
                         .outerRadius(scope.radius - 10)
                         .innerRadius(0);

                     var pie = d3.layout.pie()
                         .sort(null);

                     var g = svg_g.selectAll(".arc")
                         .data(pie([(1-scope.score), scope.score]))
                         .enter().append("g")
                         .attr("class", "arc");

                     g.append("path")
                         .attr("d", arc)
                         .style("fill", function (d, i) {
                             if (i) {
                                 return "#1e5799";
                             }
                             return "#eeeeee";
                         });


                 }, 0);
             });
         }
     }
}]);
