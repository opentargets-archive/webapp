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
                        // clinical precedence
                        {
                            label: 'Phase 4',
                            bucket: 1
                        },
                        {
                            label: 'Phase 2 or 3',
                            bucket: 2
                        },
                        {
                            label: 'Phase 0 or 1',
                            bucket: 3
                        },
                        // discovery precedence
                        {
                            label: 'PDB targets with ligands',
                            bucket: 4
                        },
                        {
                            label: 'Active compounds in ChEMBL',
                            bucket: 5
                        },
                        // predicted tractable
                        {
                            label: 'DrugEBIlity score > 0.7',
                            bucket: 6
                        },
                        {
                            label: 'DrugEBIlity score 0 to 0.7',
                            bucket: 7
                        },
                        {
                            label: 'Druggable genome',
                            bucket: 8
                        }
                        // unknown
                        // {
                        //     label: 'Remaining genome',
                        //     bucket: 10
                        // }
                    ],
                    antibody: [
                        // clinical precedence
                        {
                            label: 'Phase 4',
                            bucket: 1
                        },
                        {
                            label: 'Phase 2 or 3',
                            bucket: 2
                        },
                        {
                            label: 'Phase 0 or 1',
                            bucket: 3
                        },
                        // predicted tractable (high)
                        {
                            label: 'UniProt location - high confidence',
                            bucket: 4
                        },
                        {
                            label: 'GO cell component - high confidence',
                            bucket: 5
                        },
                        // predicted tractable (mid-low)
                        {
                            label: 'UniProt location - low or unknown confidence',
                            bucket: 6
                        },
                        {
                            label: 'UniProt predicted signal peptide or transmembrane region',
                            bucket: 7
                        },
                        {
                            label: 'GO cell component - medium confidence',
                            bucket: 8
                        },
                        // predicted tractable (HPA)
                        {
                            label: 'Human Protein Atlas - high confidence',
                            bucket: 9
                        }
                        // unknown
                        // {
                        //     label: 'Remaining genome',
                        //     bucket: 10
                        // }
                    ],
                    other_modalities: [
                        // clinical precedence
                        {
                            label: 'Phase 4',
                            bucket: 1
                        },
                        {
                            label: 'Phase 2 or 3',
                            bucket: 2
                        },
                        {
                            label: 'Phase 0 or 1',
                            bucket: 3
                        },
                    ]
                };
            }
        };
    }]);
