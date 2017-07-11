
/* Services */

angular.module('cttvServices').



    /**º
     * The Config service.
     * This stores global config variables for the font end
     */
    factory('cttvConfig', ['cttvConsts', 'initConfig', function(cttvConsts, initConfig) {
        'use strict';

        // local handle to the dbs list in the consts service
        var dbs = cttvConsts.dbs;

        function applyDb (obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    if (angular.isObject(obj[prop]) && !angular.isArray(obj[prop])) {
                        applyDb(obj[prop]);
                    } else {
                        for (var i=0; i<obj[prop].length; i++) {
                            var item = obj[prop][i];
                            if (cttvConsts.dbs[item]) {
                                obj[prop][i] = cttvConsts.dbs[item];
                            }
                        }
                    }
                }
            }
        }

        applyDb(initConfig.evidence_sources);

        // var config = {
            // flag to hide/show first column (with public/private styling) in evidence tables
            //show_access_level : false,

            // evidence sources used in the evidence page tables:
            // if multiple sources are needed (e.g. for somatic mutation table), specify these in an array
            // evidence_sources : {
            //     genetic_association : {
            //         common : [dbs.GWAS, dbs.PHEWAS, dbs.PHEWAS_23andme],
            //         rare : [dbs.UNIPROT, dbs.EVA, dbs.UNIPROT_LITERATURE, dbs.GENE_2_PHENOTYPE, dbs.GENOMICS_ENGLAND]
            //     },
            //     somatic_mutation : [dbs.CANCER_GENE_CENSUS, dbs.EVA_SOMATIC, dbs.INTOGEN],
            //     known_drug : [dbs.CHEMBL],
            //     rna_expression : [dbs.EXPRESSION_ATLAS],
            //     pathway : [dbs.REACTOME],
            //     animal_model : [dbs.PHENODIGM],
            //     literature : [dbs.EPMC]
            // },
        // };

        // config = _.merge(config, initConfig);

        // return config;
        return initConfig;
    }]);
