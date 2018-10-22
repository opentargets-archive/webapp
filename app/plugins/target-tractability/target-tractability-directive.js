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
                        'GO cell component - medium confidenc',
                        'Human Protein Atlas - high confidence',
                        'Remaining genome'
                    ]
                };

                // TODO: remove, this is for temporary development only
                scope.target.tractability = {
                    'smallmolecule': {
                        'top_category': 'Unknown',
                        'small_molecule_genome_member': null,
                        'buckets': [0, 3, 7],
                        'high_quality_compounds': 0,
                        'ensemble': -1,
                        'categories': {
                            'clinical_precedence': 0,
                            'predicted_tractable': 0,
                            'discovery_precedence': 0
                        }
                    },
                    'antibody': {
                        'top_category': 'Predicted Tractable - Medium to low confidence',
                        'buckets': [2, 3, 7],
                        'categories': {
                            'predicted_tractable_med_low_confidence': 0.25,
                            'clinical_precedence': 0,
                            'predicted_tractable_high_confidence': 0
                        }
                    }
                };
            }
        };
    }]);
