angular.module('otDirectives')

    .directive('multipleTargetsDrugsSummary', ['otApi', 'otConfig', 'otUtils', function (otApi, otConfig, otUtils) {
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

                // Disease
                row.push('<a href="/disease/' + drug.disease.id + '">' + drug.disease.label + '</a>');

                // Max Phase
                // row.push(drug.maxPhase.label);

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
                    otApi.getFilterBy(queryObject)
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
                                        disease: {
                                            label: ev.disease.efo_info.label,
                                            id: ev.disease.efo_info.efo_id.split('/').pop()
                                        },
                                        id: id.split('/').pop(),
                                        maxPhase: maxPhase,
                                        molType: molType
                                    };
                                } else {
                                    // duplicated drug...
                                }
                            }
                            var drugsArr = _.values(drugs);
                            scope.uniqueTargets = Object.keys(uniqueTargets).length;
                            scope.drugs = drugsArr;

                            $('#target-list-drugs').DataTable(otUtils.setTableToolsParams({
                                'data': formatDrugDataToArray(scope.drugs),
                                'ordering': true,
                                'order': [],
                                'autoWidth': false,
                                'paging': true,
                                'columnDefs': [
                                    {
                                        'targets': [0, 1, 2, 3],
                                        'width': '25%'
                                    }
                                ]

                            }, scope.target.length + '-targets-drugs'));
                        });
                });
            }
        };
    }]);
