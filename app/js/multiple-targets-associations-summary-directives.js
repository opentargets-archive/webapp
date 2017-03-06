angular.module('cttvDirectives')

.directive ('multipleTargetsAssociationsSummary', ['$log', 'cttvAPIservice', '$q', function ($log, cttvAPIservice, $q) {
    'use strict';

    return {
        restrict: 'E',
        scope: {
            target: "=",
            associations: '='
        },
        templateUrl: "partials/multiple-targets-associations-summary.html"
    };
}])

// .directive ('multipleTargetsTas', ['$log', function ($log) {
//     'use strict';
//
//     return {
//         restrict: 'E',
//         scope: {
//             associations: '=',
//             targets: '='
//         },
//         templateUrl: "partials/multiple-targets-tas.html",
//         link: function (scope, el, attrs) {
//             scope.$watch('associations', function () {
//                 if (!scope.associations) {
//                     return;
//                 }
//
//                 scope.targetsAssociationsLink = scope.target.map(function (t) {
//                     return "target:"+t;
//                 }).join(',');
//
//                 var therapeuticAreas = scope.associations.facets.therapeutic_area.buckets;
//                 var tas = {};
//                 for (var j=0; j<therapeuticAreas.length; j++) {
//                     tas[therapeuticAreas[j].label] = {
//                         label: therapeuticAreas[j].label,
//                         value: therapeuticAreas[j].unique_target_count.value,
//                         diseases: {},
//                         score: ~~(100 * therapeuticAreas[j].unique_target_count.value / scope.target.length)
//                     };
//                 }
//                 for (var i=0; i<scope.associations.data.length; i++) {
//                     var association = scope.associations.data[i];
//                     var target = association.target.gene_info.symbol;
//                     var diseaseLabel = association.disease.efo_info.label;
//                     var diseaseId = association.disease.id;
//                     var tasForThisDisease = association.disease.efo_info.therapeutic_area.labels;
//                     for (var k=0; k<tasForThisDisease.length; k++) {
//                         // this check shoudn't be needed, but the api treats different "other diseases" in the facets and in the data
//                         // "other diseases" vs "other"
//                         if (tas[tasForThisDisease[k]]) {
//                             if (!tas[tasForThisDisease[k]].diseases[diseaseLabel]) {
//                                 tas[tasForThisDisease[k]].diseases[diseaseLabel] = {
//                                     id: diseaseId,
//                                     label: diseaseLabel,
//                                     value: 0,
//                                     targets: []
//                                 };
//                             }
//                             tas[tasForThisDisease[k]].diseases[diseaseLabel].value++;
//                             tas[tasForThisDisease[k]].diseases[diseaseLabel].score = 100 * tas[tasForThisDisease[k]].diseases[diseaseLabel].value / scope.target.length;
//                             tas[tasForThisDisease[k]].diseases[diseaseLabel].targets.push(target);
//                         }
//                     }
//                 }
//                 // sort tas by number of targets (value);
//                 var tasArr = _.values(tas);
//                 tasArr.sort(function (a, b) {
//                     return b.value - a.value;
//                 });
//                 for (var z=0; z<tasArr.length; z++) {
//                     var diseasesArr = _.values(tasArr[z].diseases);
//                     diseasesArr.sort (function (a, b) {
//                         return b.value - a.value;
//                     });
//                     tasArr[z].diseases = diseasesArr;
//                 }
//                 scope.therapeuticAreas = tasArr;
//             });
//         }
//     };
// }])

.directive('multipleTargetsTable', ['$log', 'cttvUtils', function ($log, cttvUtils) {
    'use strict';

    function formatDiseaseDataToArray (diseases, targets) {
        var data = [];
        for (var i=0; i<diseases.length; i++) {
            var row = [];
            var d = diseases[i];

            // 0 - Disease
            // limit the length of the label
            var label = d.enriched_entity.label;
            if (d.enriched_entity.label.length > 30) {
                label = d.enriched_entity.label.substring(0, 30) + "...";
            }
            var t4d = d.targets.map(function (t) {return t.target.id});
            var compressedTargetIds = cttvUtils.compressTargetIds(t4d);
            // var targetsLink = "?targets=" + (d.targets.map(function (t) {return t.target.id}));
            var targetsLink = "?targets=" + compressedTargetIds.join(',');
            var cell = "<a href='/disease/" + d.enriched_entity.id + "/associations" + targetsLink + "'>" + label + "</a>";
            row.push(cell);

            // 1 - Targets associated
            row.push(d.targets.length);

            // 2 - Enrichment / Relevance
            row.push(d.enrichment.score.toPrecision(1));

            // 3 - Score (sum)
            var perc = 100 * d.targets.length / targets.length;
            var bars = '<div style="position:relative;width:200px;height:20px">' +
                    '<div style="width:100%;background:#eeeeee;height:100%;position:absolute;top:0px;left:0px"></div>' +
                    '<div style="width:' + perc + '%;background:#1e5799;height:100%;position:absolute;top:0px;left:0px"></div>' +
                    '<div style="width:16px;border-radius:16px;text-align:center;vertical-align:middle;line-height:16px;font-size:0.8em;background:#eeeeee;position:absolute;top:2px;left:3px;color:#1e5799"><span>' + d.targets.length + '</span></div>' +
                '</div>';
            row.push(bars);

            // 4 - Therapeutic areas (hidden)
            row.push(d.enriched_entity.properties.therapeutic_area.labels.join(', '));

            // 5 - targets
            // showing the most associated 10 targets
            var targets10 = d.targets.slice(0, 10).map(function (o) {
                return {
                    id: o.target.id,
                    label: o.target.gene_info.symbol
                }
            });
            var url = '';
            for (var j=0; j<10; j++) {
                var t = targets10[j];
                if (t) {
                    url += '<a title="View evidence" href=/evidence/' + t.id + '/' + d.enriched_entity.id + '>' + t.label + '</a> ';
                }
            }
            if (d.targets.length > 10) {
                url += "...";
            }
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
                    // scope.selectedTA = '';
                    scope.removeTaFilter();
                } else {
                    scope.selectedTA = ta.label;
                }
                table.draw();
                scope.showAll = false;
            };

            scope.removeTaFilter = function () {
                scope.selectedTA = '';
            };

            scope.showAll = false;
            scope.toggleTaFilter = function () {
                scope.showAll = !scope.showAll;
            };

            scope.$watch('associations', function () {
                if (!scope.associations) {
                    return;
                }

                // Compile the therapeutic areas...
                var tas = [];
                for (var k=0; k<scope.associations.length; k++) {
                    var dis = scope.associations[k];
                    if (!dis.enriched_entity.properties.therapeutic_area.codes.length) {
                        // This is a therapeutic area
                        var id = dis.enriched_entity.id;
                        var label = dis.enriched_entity.label;
                        var count = dis.enrichment.params.targets_in_set_in_disease;
                        var enrichment = dis.enrichment.score;
                        var score = (count / scope.targets.length).toPrecision(1);
                        var targets = dis.targets.map(function (d) {
                            return d.target.id;
                        });
                        var compressedTargetIds = cttvUtils.compressTargetIds(targets).join(',');
                        tas.push({
                            label: label,
                            id: id,
                            enrichment: enrichment,
                            value: count,
                            score: score,
                            compressedTargetIds: compressedTargetIds
                        })
                    }
                }

                scope.therapeuticAreas = tas;

                // Create a table
                // Filter based on Therapeutic area...
                // TODO: WARNING: This is set for the whole app
                $.fn.dataTable.ext.search = [
                    function (settings, data, dataIndex) {
                        if (!scope.selectedTA) {
                            return true;
                        }
                        var tas = data[4];
                        return ((tas.indexOf(scope.selectedTA) >= 0));
                    }
                ];

                // format the data
                // decide if the table sorts by number of targets or enrichment
                var order;
                if (scope.targets.length >= 2) {
                    order = [[2, 'asc']];
                } else {
                    order = [[1, 'desc']];
                }
                table = $('#target-list-associated-diseases').DataTable (cttvUtils.setTableToolsParams({
                    "data": formatDiseaseDataToArray(scope.associations, scope.targets),
                    "ordering" : true,
                    "order": order,
                    "autoWidth": false,
                    "paging" : true,
                    "columnDefs": [
                        {
                            targets: [1,4],
                            visible: false
                        }
                    ]

                }, scope.targets.length + "-targets-associated_diseases") );
            });
        }
    };
}])


// .directive('multipleTargetsBubbles', ['$log', 'cttvUtils', '$q', function ($log, cttvUtils, $q) {
//     'use strict';
//
//     return {
//         restrict: 'E',
//         templateUrl: "",
//         scope: {
//             targets: '=',
//             associations: '='
//         },
//         link: function (scope, el, attrs) {
//             // TODO: We are passing the "targets" to the expansionView
//             // but we already have the associations that can be passed (and avoid the extra call to the api)
//             scope.$watch('associations', function () {
//                 if (!scope.associations) {
//                     return;
//                 }
//
//                 var container = document.createElement("div");
//                 el[0].appendChild(container);
//
//                 var dataPromise = $q(function (resolve) {
//                     resolve({
//                         "body": scope.associations
//                     });
//                 });
//
//                 var targetListAssocBubbles = expansionView()
//                     .data(dataPromise);
//                     // .targets(scope.target);
//                 targetListAssocBubbles (container);
//
//             });
//
//         }
//     };
// }])

.directive ('percPiechart', ['$log', '$timeout', function ($log, $timeout) {
    'use strict';
     return {
         restrict: 'E',
         template: '',
         scope: {
             score: '=' // [0,1]
         },
         link: function (scope, el, attrs) {
             scope.radius = 50;

             scope.$watch('score', function () {
                 if (!scope.score) {
                     return;
                 }

                 $timeout (function () {
                     var svg_g = d3.select(el[0])
                         .append("svg")
                         .attr("width", scope.radius * 1.5)
                         .attr("height", scope.radius * 1.5)
                         .append("g")
                         .attr("transform", "translate(" + ~~scope.radius/2 + "," + ~~scope.radius/2 + ")");

                     var arc = d3.svg.arc()
                         .outerRadius(scope.radius - ~~(scope.radius/2))
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
