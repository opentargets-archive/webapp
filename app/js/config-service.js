
/* Services */

angular.module('cttvServices').



    /**
     * The Config service.
     * This stores global config variables for the font end
     */
    factory('cttvConfig', ['cttvConsts', function(cttvConsts) {
        'use strict';

        // local handle to the dbs list in the consts service
        var dbs = cttvConsts.dbs;

        var config = {
            // flag to hide/show first column (with public/private styling) in evidence tables
            show_access_level : false,

            // evidence sources used in the evidence page tables:
            // if multiple sources are needed (e.g. for somatic mutation table), specify these in an array
            evidence_sources : {
                genetic_association : {
                    common : [dbs.GWAS],
                    rare : [dbs.UNIPROT, dbs.EVA, dbs.UNIPROT_LITERATURE]
                },
                somatic_mutation : [dbs.CANCER_GENE_CENSUS, dbs.EVA_SOMATIC],
                known_drug : [dbs.CHEMBL],
                rna_expression : [dbs.EXPRESSION_ATLAS],
                pathway : [dbs.REACTOME],
                animal_model : [dbs.PHENODIGM],
                literature : [dbs.EPMC]
            },
            dumps_link: "/downloads/data",

            targetSections: [
                {
                    name: "featuresViewer",
                    element: "target-features",
                    heading: "Protein Information (from Uniprot)",
                    // visible: false,
                    dependencies: {
                        'https://ebi-uniprot.github.io/CDN/feature-viewer/2.0.0/featuresviewer.min.js': {
                            'format': 'global'
                        },
                        'https://ebi-uniprot.github.io/CDN/feature-viewer/css/main.css!': {
                            'loader': 'css'
                        },
                        'https://ebi-uniprot.github.io/CDN/feature-viewer/css/fontello.css': {
                            'loader': 'css'
                        }
                    }
                },

                {
                    name: "Variants",
                    element: 'genome-browser',
                    heading: "Variants, isoforms and genomic context",
                    // visible: false,
                },

                {
                    name: "ProteinExpression",
                    element: "protein-baseline-expression",
                    heading: "Protein baseline expression",
                    // visible: false
                },

                {
                    name: "RnaExpression",
                    element: "rna-baseline-expression",
                    heading: "RNA baseline expression",
                    // visible: false,
                    dependencies: {
                        "vendor/expressionAtlasBundle/vendor.bundle.js": {
                            "format": "global"
                        },
                        "vendor/expressionAtlasBundle/expression-atlas-heatmap.bundle.js": {
                            "format": "global"
                        }
                    }
                },

                {
                    name: "GeneOntology",
                    element: "gene-ontology",
                    heading: "Gene Ontology",
                    // visible: false,
                },

                {
                    name: "ProteinStructure",
                    element: "pdb-target",
                    heading: "Protein Structure (PDB)",
                    // visible: false,
                },

                {
                    name: "Pathways",
                    element: "target-pathways",
                    heading: "Pathways",
                    // visible: false,
                    // dependencies: {
                    //     '/proxy/www.reactome.org/DiagramJs/diagram/diagram.nocache.js': {
                    //         "format": "global",
                    //         "scriptLoad": true
                    //     }
                    // }
                },

                {
                    name: "Drugs",
                    element: "drugs-display",
                    heading: "Drugs",
                    // visible: false
                },

                {
                    name: "targetFamily",
                    element: 'target-family',
                    heading: 'Target Family',
                    // visible: false
                },
                {
                    name: "Bibliography",
                    element: 'bibliography-target',
                    heading: 'Bibliography',
                    // visible: false
                },
                // {
                //     // The name of the plugin (must be unique)
                //     name: "test",
                //     // The custom element exposed by the plugin directive
                //     element: "test-plugin",
                //     // The text to appear as the heading of the plugin
                //     heading: "Test plugin",
                //     // If it is visible by default
                //     visible: false,
                //     // The dependencies of the plugin
                //     // dependencies: ['/plugins/asyncTest.js']
                //     dependencies: {
                //         '/plugins/asyncTest.js': {
                //             "format": "global"
                //         }
                //     }
                // }
            ]
        };


        return config;
    }]);
