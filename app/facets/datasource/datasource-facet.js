angular.module('otFacets')

    /**
     * The Datasource facet
     */
    .directive('datasoruceFacet', [function () {
        'use strict';

        return {
            restrict: 'AE',
            scope: {
                facet: '='// ,
                // partial: '@'
            },
            // templateUrl: 'facets/datasoruce/datatype-facet.html',
            template: ''   // not needed for now as datasources are only show under each datatype
        };
    }]);
