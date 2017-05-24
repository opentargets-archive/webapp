/* Services */

/**
*  Service that compiles the information about Target Enabling Packages (TEPs)
*  More info of this packages: http://www.thesgc.org/tep
*  This information is static and needs to be updated when new TEPs are made available
* */
angular.module('cttvServices').

    factory('otTEPs', [function() {
        'use strict';

        return {
            ENSG00000094631: {
                id: 'ENSG00000094631',
                symbol: 'HDAC6'
            },
            ENSG00000120733: {
                id: 'ENSG00000120733',
                symbol: 'KDM3B'
            },
            ENSG00000186280: {
                id: 'ENSG00000186280',
                symbol: 'KDM4D'
            },
            ENSG00000146247: {
                id: 'ENSG00000146247',
                symbol: 'PHIP'
            },
            ENSG00000108469: {
                id: 'ENSG00000108469',
                symbol: 'RECQL5'
            },
            ENSG00000143379: {
                id: 'ENSG00000143379',
                symbol: 'SETDB1'
            },
            ENSG00000167258: {
                id: 'ENSG00000167258',
                symbol: 'CDK12'
            }
        };
    }]);
