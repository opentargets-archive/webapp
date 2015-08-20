'use strict';


/* Services */

angular.module('cttvServices').



    /**
     * The API services, with methods to call the ElasticSearch API
     */
    factory('cttvConsts', ['$log', function($log) {

        var consts = {
            datatypes : {
                GENETIC_ASSOCIATION : "genetic_association",
                SOMATIC_MUTATION :    "somatic_mutation",
                KNOWN_DRUG :          "known_drug",
                RNA_EXPRESSION :      "rna_expression",
                AFFECTED_PATHWAY :    "affected_pathway",
                ANIMAL_MODEL :        "animal_model",
                LITERATURE :          "literature"
            },
            dbs : {
                EXPRESSION_ATLAS :    "expression_atlas",
                UNIPROT :             "uniprot",
                REACTOME :            "reactome",
                EVA :                 "eva",
                PHENODIGM :           "phenodigm",
                GWAS :                "gwas_catalog",
                CANCER_GENE_CENSUS :  "cancer_gene_census",
                CHEMBL :              "chembl",
                DISGENET :            "disgenet"
            },
            DATATYPES: 'datatypes',
            PATHWAY_TYPES: 'pathway_type',
            DATASOURCES: 'datasources',
            UNIQUE_TARGET_COUNT: 'unique_target_count',
            UNIQUE_DISEASE_COUNT: 'unique_disease_count'
        };


        return consts;
    }]);