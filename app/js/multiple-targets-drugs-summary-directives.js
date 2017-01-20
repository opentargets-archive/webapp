angular.module('cttvDirectives')

.directive ('multipleTargetsDrugsSummary', ['$log', 'cttvAPIservice', 'cttvConfig', 'cttvUtils', function ($log, cttvAPIservice, cttvConfig, cttvUtils) {
    'use strict';

    function formatDrugDataToArray (drugs) {
        $log.log("drugs to format in table...");
        $log.log(drugs);
        var data = [];
        for (var i=0; i<drugs.length; i++) {
            var drug = drugs[i];
            var row = [];

            // Drug name
            row.push('<a href=/summary?drug=' + drug.id + '>' + drug.drug + '');

            // Target
            row.push(drug.target);

            // Max Phase
            row.push(drug.maxPhase.label);

            // Molecule type
            row.push(drug.molType);

            data.push(row);
        }
        return data;
    }

    return {
        restrict: 'E',
        // template: '' +
        // '<div ng-show="drugs">' +
        // '    <h3>Drugs found for {{uniqueTargets}} targets</h3>' +
        // '    <drug-summary ng-repeat="target in drugs" target="target"></drug>' +
        // '</div>',
        templateUrl: 'partials/multiple-targets-drugs.html',
        scope: {
            targets: '='
        },
        link: function (scope, el, attrs) {
            scope.$watch('targets', function () {
                if (!scope.targets) {
                    return;
                }

                // The real number of targets for which we have drug data
                var uniqueTargets = {};

                var queryObject = {
                    method: 'POST',
                    trackCall: false,
                    params: {
                        target: scope.targets.map(function (d) {return d.ensembl_gene_id;}),
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
                        $log.log("drugs response...");
                        $log.log(resp);
                        var drugs = {};
                        for (var i=0; i<resp.body.data.length; i++) {
                            var ev = resp.body.data[i];
                            var target = ev.target.gene_info.symbol;
                            var drug = ev.drug.molecule_name;
                            var molType = ev.drug.molecule_type;
                            var maxPhase = ev.drug.max_phase_for_all_diseases;
                            var id = ev.drug.id[0];
                            if (!drugs[drug]) {
                                uniqueTargets[target] = true;
                                drugs[drug] = {
                                    target: target,
                                    drug: drug,
                                    id: id.split('/').pop(),
                                    maxPhase: maxPhase,
                                    molType: molType
                                };
                            } else {
                                $log.log("duplicated drug...");
                                $log.log(drugs[drug]);
                                $log.log(ev);
                            }
                            // drugs[target].drugs[drug] = {
                            //     name: drug,
                            //     id: id
                            // };
                        }
                        var drugsArr = _.values(drugs);
                        $log.log(drugsArr);
                        // for (var j=0; j<drugsArr.length; j++) {
                        //     drugsArr[j].drugs = _.values(drugsArr[j].drugs);
                        // }
                        scope.uniqueTargets = Object.keys(uniqueTargets).length;
                        scope.drugs = drugsArr;

                        var table = $('#target-list-drugs').DataTable(cttvUtils.setTableToolsParams({
                            "data": formatDrugDataToArray(scope.drugs),
                            "ordering": true,
                            "order": [[2, "desc"]],
                            "autoWidth": false,
                            "paging": true,
                            "columnDefs": []

                        }, scope.targets.length + "-targets-drugs"));


                    });

            });
        }
    };
}]);
// .directive('drugSummary', ['$log', function ($log) {
//     'use strict';
//
//     return {
//         restrict: 'E',
//         template: '' +
//         '<div ng-click="showDrugs=!showDrugs" style="cursor:pointer">' +
//         '   {{target.target}} -- {{target.drugs.length}} drugs' +
//         '</div>' +
//         '<div ng-show=showDrugs>' +
//         '     <span ng-repeat="drug in target.drugs">' +
//         '        <a target=_blank href="{{drug.id}}">' +
//         '           <i class="cttv-drug">{{drug.name}}</i>' +
//         '        </a>' +
//         '     </span>' +
//         '</div>',
//         scope: {
//             target: '='
//         }
//     };
// }]);
