'use strict';


/* Services */

angular.module('cttvServices').



    /**
     * The API services, with methods to call the ElasticSearch API
     */
    factory('cttvDictionary', ['$log', function($log) {

        var dictionary = {
            ASSOCIATION_SCORE :      "Association score",
            GENETIC_ASSOCIATION :    "Genetic associations",
            SOMATIC_MUTATION :       "Somatic mutations",
            KNOWN_DRUG :             "Known drugs",
            RNA_EXPRESSION:          "RNA expression",
            AFFECTED_PATHWAY :       "Affected pathways",
            MOUSE_MODEL :            "Animal models",
            ANIMAL_MODEL :           "Animal models",
            DATATYPES :              "Datatypes",
            ENSEMBL_ID :             "Ensembl ID"
        }

        dictionary.get = function(w){
            //return en[w] || undefined;
        }


        return dictionary;
    }]);