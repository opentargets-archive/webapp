/* Services */

angular.module('otServices')

    /**
     * The API services, with methods to call the ElasticSearch API
     */
    .factory('otDefinitions', [function () {
        'use strict';

        var definitions = {
            'ENRICHMENT.DISEASES': {
                'description': 'This is the probability (expressed as a pvalue) of finding a disease associated with this set of targets. The lower this value, the higher the probability your targets are specific to the disease',
                'link': ''
            },
            'ENRICHMENT.PATHWAYS': {
                'description': 'This is the probability (expressed as a pvalue) of finding a pathway associated with this set of targets. The lower this value, the higher the probability your targets are specific to the pathway',
                'link': ''
            },
            'KEEPLOADEDLISTS': {
                'description': 'If this option is checked your lists will be stored in the browser for easier access. You can still remove them at any time',
                'link': ''
            },
            'TEP': {
                'description': 'TEPs provide a critical mass of reagents and knowledge on a protein target to allow rapid biochemical and chemical exploration and characterisation of proteins with genetic linkage to key disease areas. Click on this icon to know more about TEPs',
                'link': 'http://www.thesgc.org/tep'
            }
        };

        return definitions;
    }]);
