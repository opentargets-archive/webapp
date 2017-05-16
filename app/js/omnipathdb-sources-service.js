/* Services */

angular.module('cttvServices')

/**
 * The API services, with methods to call the ElasticSearch API
 */
    .factory('omnipathdbSources', [function () {
        'use strict';
        // Map between omnipathdb sources and type of interactions
        // Not considered:
        // laudana_*: Combined, mixed sources
        // Wang: Combines several sources (mostly Pathways information)

        return {
            // Pathways
            'SignaLink3': 'Pathways',
            'Signor': 'Pathways',
            // 'Reactome': 'Pathways', // This data is coming from Reactome directly, so removed from here
            'SPIKE': 'Pathways',

            // Enzyme-substrate
            'PhosphoPoint': 'Enzyme-substrate',
            'HPRD': 'Enzyme-substrate',
            'HPRD-phos': 'Enzyme-substrate',
            'MIMP': 'Enzyme-substrate',
            'HuPho': 'Enzyme-substrate',

            // PPI
            'BioGRID': 'PPI',
            'InnateDB': 'PPI',
            'IntAct': 'PPI',
            'DIP': 'PPI',
            'STRING': 'PPI'
        };
    }])
    .factory('omnipathdbCategories', [function () {
        return {
            'Pathways': {
                'SignaLink3': true,
                'Signor': true,
                'Reactome': true,
                'SPIKE': true
            },
            'Enzyme-substrate': {
                'PhosphoPoint': true,
                'HPRD': true,
                'HPRD-phos': true,
                'MIMP': true,
                'HuPho': true
            },
            'PPI': {
                'BioGRID': true,
                'InnateDB': true,
                'IntAct': true,
                'DIP': true,
                'STRING': true
            }
        };
    }]);
