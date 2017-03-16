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

.directive('multipleTargetsTable', ['$log', 'cttvUtils', 'cttvConsts', 'cttvDictionary', function ($log, cttvUtils, cttvConsts, cttvDictionary) {
    'use strict';

    function resolveTies (input, pvalPos, sortedTAs) {
        // input is an array of TAs that have a tie
        // if it is able to resolve the ties, push the ordered list to sortedTAs,
        // if not, calls itself recursively

        //sort the array
        input.sort(function (a, b) {
            return a.diseasePvals[pvalPos] - b.diseasePvals[pvalPos];
        });

        // look for ties
        // group ties in an array and call resolveTies recursively
        var nextGroup = [];
        for (var i=0; i<input.length; i++) {
            nextGroup.push(input[i]);
            for (var j=i+1; j<input.length; j++) {
                // same group
                if (input[i].diseasePvals[pvalPos] === input[j].diseasePvals[pvalPos]) {
                    nextGroup.push(input[j]);
                } else {
                    // different group
                    break;
                }
            }
            // We may have a group here, so resolve ties and substitute current position with the resolved one
            if (nextGroup.length > 1) {
                // $log.log("this group will be placed at " + (inputPos) + " and expand " + (nextGroup.length) + " positions in the array");
                // input.splice(inputPos, nextGroup.length, resolveTies(nextGroup, (pvalPos+1), (inputPos+i)));
                resolveTies(nextGroup, (pvalPos+1), sortedTAs);
            } else {
                // Only 1 item in group, we have managed to resolve all the ties
                sortedTAs.push(input[i]);
            }
            nextGroup = [];
            i = j-1;
        }
    }

    function sortTAs (unsorted, sorted) {
        // 1st sort the disease pvalues of each TA
        // TODO: They should come sorted from the api (default sorting from enrichment endpoint). So this may not be needed
        for (var i=0; i<unsorted.length; i++) {
            var ta = unsorted[i];
            ta.diseasePvals.sort(function (a,b) {
                return a-b;
            });
        }

        // loop over the TAs and choose which one is the best ranked based on the pvals
        resolveTies(unsorted, 0, sorted);
    }

    function formatDiseaseDataToArray (diseases, targets) {
        var data = [];

        // $log.log("these are the targets...");
        // $log.log(targets);

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
            // row.push(d.targets.length);

            // 1 - Enrichment / Relevance
            row.push(d.enrichment.score.toPrecision(1));

            // 2 - Score (sum)
            var perc = 100 * d.targets.length / targets.length;
            var bars = '<div style="position:relative;width:200px;height:20px">' +
                    '<div style="width:100%;background:#eeeeee;height:100%;position:absolute;top:0px;left:0px"></div>' +
                    '<div style="width:' + perc + '%;background:#1e5799;height:100%;position:absolute;top:0px;left:0px"></div>' +
                    '<div style="width:16px;border-radius:16px;text-align:center;vertical-align:middle;line-height:16px;font-size:0.8em;background:#eeeeee;position:absolute;top:2px;left:3px;color:#1e5799"><span>' + d.targets.length + '</span></div>' +
                '</div>';
            row.push(bars);

            // 3 - Therapeutic areas (hidden)
            row.push(d.enriched_entity.properties.therapeutic_area.labels.join(', '));

            // 4 - targets (computing 5 and 6)
            // showing the most associated 10 targets
            var allTargetIds = [];
            var allTargets = d.targets.map(function (o) {
                allTargetIds.push(o.target.id);
                return {
                    id: o.target.id,
                    label: o.target.gene_info.symbol
                };
            });

            var targets10 = allTargets.slice(0, 10);
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

            // 5 - All targets
            row.push(allTargets.map(function (o) {
                    return o.label;
                }).join(' '));

            // 6 - Use this list
            var listUrl = '/summary?targets=' + cttvUtils.compressTargetIds(allTargetIds).join(',');
            row.push("<a href=" + listUrl + "><button class='bt bt-primary'>Go</button></a>");

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
            // Datatypes;
            scope.datatypes = [];
            var datatypes = cttvConsts.datatypesOrder;
            for (var i = 0; i < datatypes.length; i++) {
                scope.datatypes.push({
                    // label: cttvConsts.datatypesLabels[datatypes[i]],
                    label: cttvDictionary[datatypes[i]],
                    id: cttvConsts.datatypes[datatypes[i]],
                    selected: true
                })
            }

            // Toggle Datatype filter
            scope.toggleDatatypeFilter = function (datatype) {
                datatype.selected = !datatype.selected;

                // Filter out the data
                var newData = [];
                for (var i=0; i<scope.associations.length; i++) {
                    var assoc = scope.associations[i];
                    var targets = assoc.targets;
                    var newTargets = [];
                    loop2:
                    for (var j=0; j<targets.length; j++) {
                        var t = targets[j];
                        for (var k=0; k<scope.datatypes.length; k++) {
                            var dt = scope.datatypes[k];
                            if (dt.selected) {
                                if (t.association_score.datatypes[dt.id] > 0) {
                                    // This target has the datatype
                                    newTargets.push(t);
                                    continue loop2;
                                }
                            }
                        }
                    }
                    if (newTargets.length > 0) {
                        // The association has this datatype, so we include it
                        newData.push({
                            targets: newTargets,
                            enrichment: assoc.enrichment,
                            enriched_entity: assoc.enriched_entity
                        });
                    }
                }
                var dtapi = $('#target-list-associated-diseases').dataTable().api();
                var rows = formatDiseaseDataToArray(newData, scope.targets);
                dtapi.clear();
                dtapi.rows.add(rows);
                dtapi.draw();
            };


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
                scope.selectedTA = undefined;
                table.draw();
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
                // To improve the ranking of TAs we compile the pvalues of all the diseases under the TA and sort based on those (not the enrichment of the TA itself)
                var tas = [];
                var pvals4TAs = {}; // We store in an object the set of pvalues for any disease belonging to a TA
                for (var k=0; k<scope.associations.length; k++) {
                    var dis = scope.associations[k];
                    // If it is a TA
                    if (!dis.enriched_entity.properties.therapeutic_area.codes.length) {
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
                            enrichment: +enrichment,
                            value: count,
                            score: score,
                            compressedTargetIds: compressedTargetIds
                        });
                    }
                    // If not, get the pvalue of the disease and put it under the TA(s)
                    else {
                        var pval = dis.enrichment.score;
                        var tas4disease = dis.enriched_entity.properties.therapeutic_area.codes;
                        for (var i=0; i<tas4disease.length; i++) {
                            var ta = tas4disease[i]; // TA is the code
                            if (!pvals4TAs[ta]) {
                                pvals4TAs[ta] = [];
                            }
                            pvals4TAs[ta].push(pval);
                        }
                    }
                }

                // Enrich the TAs with the disease pvals
                for (var l=0; l<tas.length; l++) {
                    var thisTA = tas[l];
                    thisTA.diseasePvals = pvals4TAs[thisTA.id];
                }

                // scope.unsortedTherapeuticAreas = tas;
                scope.sortedTAs = [];
                sortTAs(tas, scope.sortedTAs);
                scope.therapeuticAreas = scope.sortedTAs;

                // Create a table
                // Filter based on Therapeutic area...
                // TODO: WARNING: This is set for the whole app (and removing any other search)
                $.fn.dataTable.ext.search = [
                    function (settings, data, dataIndex) {
                        if (!scope.selectedTA) {
                            return true;
                        }
                        var tas = data[3];
                        return ((tas.indexOf(scope.selectedTA) >= 0));
                    }
                ];

                // format the data
                // decide if the table sorts by number of targets or enrichment
                var order;
                if (scope.targets.length >= 2) {
                    order = [[1, 'asc']];
                } else {
                    order = [[2, 'desc']];
                }
                table = $('#target-list-associated-diseases').DataTable (cttvUtils.setTableToolsParams({
                    "data": formatDiseaseDataToArray(scope.associations, scope.targets),
                    "ordering" : true,
                    "order": order,
                    "autoWidth": false,
                    "paging" : true,
                    "columnDefs": [
                        {
                            targets: [3,5],
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
