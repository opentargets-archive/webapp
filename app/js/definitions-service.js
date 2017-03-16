/* Services */

angular.module('cttvServices').

    /**
     * The API services, with methods to call the ElasticSearch API
     */
    factory('otDefinitions', ['$log', function($log) {
        'use strict';

        var definitions = {
            'ENRICHMENT': {
                "description": "This value represents the relevance of this disease with respect to the target list provided",
                "link": ""
            }
        };

        return definitions;
    }]);
