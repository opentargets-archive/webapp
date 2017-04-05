/* Services */

angular.module('cttvServices').

    /**
     * The API services, with methods to call the ElasticSearch API
     */
    factory('otDefinitions', ['$log', function($log) {
        'use strict';

        var definitions = {
            'ENRICHMENT.DISEASES': {
                "description": "This is the probability (expressed as a pvalue) of finding a disease associated with this set of targets. The lower this value, the higher the probability your targets are specific to the disease",
                "link": ""
            },
            'ENRICHMENT.PATHWAYS': {
                "description": "This is the probability (expressed as a pvalue) of finding a pathway associated with this set of targets. The lower this value, the higher the probability your targets are specific to the pathway",
                "link": ""
            },
            'KEEPLOADEDLISTS': {
                "description": "If this option is checked your lists will be stored in the browser for easier access. You can still remove them at any time",
                "link": ""
            }
        };

        return definitions;
    }]);
