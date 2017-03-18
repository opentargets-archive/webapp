/* Services */

angular.module('cttvServices').

    /**
     * The API services, with methods to call the ElasticSearch API
     */
    factory('otDefinitions', ['$log', function($log) {
        'use strict';

        var definitions = {
            'ENRICHMENT.DISEASES': {
                "description": "This is the probability (expressed as a p-value) of finding a disease associated with the targets in your list. The lower this value, the higher the probability your targets are specific to the disease",
                "link": ""
            },
            'ENRICHMENT.PATHWAYS': {
                "description": "This is the probability (expressed as a p-value) of finding a pathway associated with the targets in your list. The lower this value, the higher the probability your targets are specific to the pathway",
                "link": ""
            }

        };

        return definitions;
    }]);
