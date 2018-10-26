angular.module('otPlugins')
    .directive('otTargetTractability', ['otConsts', function (otConsts) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/target-tractability/target-tractability.html',
            scope: {
                target: '='
            },
            link: function (scope, element, attrs) {
                otConsts;
                scope;
                element;
                attrs;

                scope.columns = {
                    smallmolecule: [
                        'Phase 4',
                        'Phase 2 or 3',
                        'Phase 0 or 1',
                        'PDB targets with ligands',
                        'Active compounds in ChEMBL',
                        'DrugEBIlity score > 0.7',
                        'DrugEBIlity score 0 to 0.7',
                        'Druggable genome',
                        'Remaining genome'
                    ],
                    antibody: [
                        'Phase 4',
                        'Phase 2 or 3',
                        'Phase 0 or 1',
                        'UniProt location - high confidence',
                        'GO cell component - high confidence',
                        'UniProt location - low or unknown confidence',
                        'UniProt predicted signal peptide or transmembrane region',
                        'GO cell component - medium confidence',
                        'Human Protein Atlas - high confidence',
                        'Remaining genome'
                    ]
                };
            }
        };
    }]);
