

/* Services */

angular.module('cttvServices').

    /**
     * The API services, with methods to call the ElasticSearch API
     */
    factory('cttvDictionary', ['$log', function($log) {
        'use strict';

        var dictionary = {


            // A
            AFFECTED_PATHWAY :               "Affected pathways",
            ANIMAL_MODEL :                   "Animal models",
            ASSOCIATION_SCORE :              "Association score",

            // B
            // C
            CANCER_GENE_CENSUS :             "Cancer Gene Census",
            CHEMBL :                         "CHEMBL",
            COMMON_DISEASES :                "Common diseases",
            CTTV_PIPELINE :                  "Open Targets pipeline",

            // D
            DATA_DISTRIBUTION :              "Data distribution",
            DATATYPES :                      "Data types",
            DATA_TYPES :                     "Data types",
            DISEASE :                        "Disease",
            DISGENET :                       "DisGeNET",

            // E
            ENSEMBL_ID :                     "Ensembl ID",
            EPMC :                           "Europe PMC",
            EVA :                            "European Variation Archive (EVA)",
            EVA_SOMATIC :                    "European Variation Archive (EVA)",
            EXP_DISEASE_ASSOC_LABEL :        "targets_associated_with_",
            EXP_TARGET_ASSOC_LABEL :         "diseases_associated_with_",
            EXPRESSION_ATLAS:                "Expression Atlas",


            // F
            // G
            GENE_2_PHENOTYPE :               "Gene2Phenotype",
            GENETIC_ASSOCIATION :            "Genetic associations",
            GENOMICS_ENGLAND:                "Genomics England PanelApp",
            GWAS :                           "GWAS catalog",

            // H
            // I
            INTOGEN :                        "IntOGen",
            // J
            // K
            KNOWN_DRUG :                     "Drugs",

            // L
            LITERATURE :                     "Text mining",

            // M
            MOUSE_MODEL :                    "Animal models",

            // N
            NA :                             "N/A",
            NO_DATA :                        "No data",

            // O
            // P
            PATHWAY :                        "Pathway types",
            PHENODIGM :                      "Phenodigm",
            PHEWAS :                         "PheWAS catalog",
            PHEWAS_23andme :                 "23andme",

            // Q
            // R
            RARE_DISEASES :                  "Rare diseases",
            REACTOME :                       "Reactome",
            RNA_EXPRESSION:                  "RNA expression",

            // S
            SCORE :                          "Association strength", //confidence", // "Score",
            SOMATIC_MUTATION :               "Somatic mutations",

            // T
            TARGET_NAME :                    "Target name",
            TARGET_SYMBOL :                  "Target symbol",
            THERAPEUTIC_AREA :               "Therapeutic area",
            THERAPEUTIC_AREAS :              "Therapeutic areas",
            TARGET_CLASS :                   "Target class",

            // U
            UNIPROT :                        "UniProt",
            UNIPROT_LITERATURE:              "UniProt literature",
            UP_OR_DOWN:                      "unclassified",

            // V
            // W
            // X
            // Y
            // Z

        };


        dictionary.get = function(w){
            //return en[w] || undefined;
        };

        dictionary.invert = function(val){
            var a = invLookup(dictionary, val);
            return a;
        };

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

        return dictionary;
    }]);
