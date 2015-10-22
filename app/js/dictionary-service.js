'use strict';


/* Services */

angular.module('cttvServices').



    /**
     * The API services, with methods to call the ElasticSearch API
     */
    factory('cttvDictionary', ['$log', function($log) {

        var dictionary = {


            // A
            AFFECTED_PATHWAY :       "Affected pathways",
            ANIMAL_MODEL :           "Animal models",
            ASSOCIATION_SCORE :      "Association score",

            // B
            // C
            CANCER_GENE_CENSUS :     "Cancer Gene Census",
            CHEMBL :                 "CHEMBL",
            COMMON_DISEASES :        "Common diseases",
            CTTV_PIPELINE :          "CTTV pipeline",

            // D
            DATA_DISTRIBUTION :      "Data distribution",
            DATATYPES :              "Datatypes",
            DISGENET :               "DisGeNET",

            // E
            ENSEMBL_ID :             "Ensembl ID",
            EPMC :                   "Europe PMC",
            EXPRESSION_ATLAS :       "Expression Atlas",
            EVA :                    "European Variation Archive (EVA)",
            EVA_SOMATIC :            "European Variation Archive (EVA)",

            // F
            // G
            GENETIC_ASSOCIATION :    "Genetic associations",
            GWAS :                   "GWAS catalog",

            // H
            // I
            // J
            // K
            KNOWN_DRUG :             "Drugs",

            // L
            LITERATURE :             "Text mining",

            // M
            MOUSE_MODEL :            "Animal models",

            // N
            NA :                     "N/A",
            NO_DATA :                "No data",

            // O
            // P
            PHENODIGM :              "Phenodigm",

            // Q
            // R
            RARE_DISEASES :          "Rare diseases",
            REACTOME :               "Reactome",
            RNA_EXPRESSION:          "RNA expression",

            // S
            SCORE :                  "Association strength", //confidence", // "Score",
            SOMATIC_MUTATION :       "Somatic mutations",

            // T

            // U
            UNIPROT :                "UniProt",
            UNIPROT_LITERATURE:      "UniProt literature",
            UP_OR_DOWN:              "unclassified",

            // V
            // W
            // X
            // Y
            // Z

        };


        dictionary.get = function(w){
            //return en[w] || undefined;
        }


        return dictionary;
    }]);


