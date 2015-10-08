
/* Services */

angular.module('cttvServices').



    /**
     * The API services, with methods to call the ElasticSearch API
     */
    factory('cttvConsts', ['$log', function($log) {
        'use strict';
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
                UNIPROT_LITERATURE:   "uniprot_literature",
                REACTOME :            "reactome",
                EVA :                 "eva",
                PHENODIGM :           "phenodigm",
                GWAS :                "gwas_catalog",
                CANCER_GENE_CENSUS :  "cancer_gene_census",
                CHEMBL :              "chembl",
                DISGENET :            "disgenet",
                EPMC :                "europepmc",
                EVA_SOMATIC :         "eva_somatic"
            },
            datatypesOrder: [
                "GENETIC_ASSOCIATION", "SOMATIC_MUTATION", "KNOWN_DRUG", "AFFECTED_PATHWAY", "RNA_EXPRESSION", "LITERATURE", "ANIMAL_MODEL"
            ],
            datatypesLabels: {
                GENETIC_ASSOCIATION: "Genetics",
                SOMATIC_MUTATION: "Somatic",
                KNOWN_DRUG: "Drugs",
                RNA_EXPRESSION: "RNA",
                AFFECTED_PATHWAY: "Pathways",
                ANIMAL_MODEL: "Mouse",
                LITERATURE: "Text Mining"
            },
            DATATYPES: 'datatypes',
            PATHWAY_TYPES: 'pathway_type',
            DATASOURCES: 'datasources',
            UNIQUE_TARGET_COUNT: 'unique_target_count',
            UNIQUE_DISEASE_COUNT: 'unique_disease_count',
            DATA_DISTRIBUTION: 'data_distribution',
            SCORE_MIN: 'score_min',
            SCORE_MAX: 'score_max',
            SCORE_STR: 'score_str',
            defaults : {
                STRINGENCY : 1,
                SCORE_MIN : 0.0,
                SCORE_MAX : 1.0
            },
            OK : 'ok',
            ACCESS_LEVEL_PUBLIC: 'public',
            ACCESS_LEVEL_PRIVATE: 'private',
        };

        consts.invert = function(val){
            var a = invLookup(consts, val);
            return a;
        }

        function invLookup(o ,v){
            var k = undefined;
            for(var i in o){
                if(o.hasOwnProperty(i)){
                    //$log.log(v+") "+i+" = "+o[i]);
                    if(o[i]==v){
                        k = i;
                        //$log.log("   "+k);
                        return k;
                    }
                    if( typeof o[i] == 'object' ){
                        k = invLookup(o[i],v);
                        if(k){return k;}
                    }
                }
            }
            return k;
        }



        return consts;
    }]);
