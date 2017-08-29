angular.module('otDirectives')

    .directive('multipleTargetsDrugsSummary', ['otAPIservice', 'otConfig', 'otUtils', function (otAPIservice, otConfig, otUtils) {
        'use strict';

        function formatDrugDataToArray (drugs) {
            var data = [];
            for (var i = 0; i < drugs.length; i++) {
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
            templateUrl: 'src/components/multiple-targets/multiple-targets-drugs.html',
            scope: {
                target: '='
            },
            link: function (scope) {
                scope.$watch('target', function () {
                    if (!scope.target) {
                        return;
                    }

                    // The real number of targets for which we have drug data
                    var uniqueTargets = {};

                    var queryObject = {
                        method: 'POST',
                        trackCall: false,
                        params: {
                            target: scope.target.map(function (d) { return d.ensembl_gene_id; }),
                            size: 10000,
                            datasource: otConfig.evidence_sources.known_drug,
                            fields: [
                                'disease.efo_info',
                                'drug',
                                'evidence',
                                'target',
                                'access_level'
                            ]
                        }
                    };
                    otAPIservice.getFilterBy(queryObject)
                        .then(function (resp) {
                            var drugs = {};
                            for (var i = 0; i < resp.body.data.length; i++) {
                                var ev = resp.body.data[i];
                                var target = ev.target.gene_info.symbol;
                                var drug = ev.drug.molecule_name;
                                var molType = ev.drug.molecule_type;
                                var maxPhase = ev.drug.max_phase_for_all_diseases;
                                var id = ev.drug.id;
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
                                // $log.log("duplicated drug...");
                                // $log.log(drugs[drug]);
                                // $log.log(ev);
                                }
                            // drugs[target].drugs[drug] = {
                            //     name: drug,
                            //     id: id
                            // };
                            }
                            var drugsArr = _.values(drugs);
                            // for (var j=0; j<drugsArr.length; j++) {
                            //     drugsArr[j].drugs = _.values(drugsArr[j].drugs);
                            // }
                            scope.uniqueTargets = Object.keys(uniqueTargets).length;
                            scope.drugs = drugsArr;

                            $('#target-list-drugs').DataTable(otUtils.setTableToolsParams({
                                'data': formatDrugDataToArray(scope.drugs),
                                'ordering': true,
                                'order': [[2, 'desc']],
                                'autoWidth': false,
                                'paging': true,
                                'columnDefs': []

                            }, scope.target.length + '-targets-drugs'));
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
