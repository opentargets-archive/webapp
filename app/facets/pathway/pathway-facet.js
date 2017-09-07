angular.module('facets')

    /**
     * The Pathway facet
     */
    .directive('pathwayFacet', [function () {
        'use strict';

        return {
            restrict: 'AE',
            scope: {
                facet: '='
            },
            templateUrl: 'directives/generic-nested-facetcollection.html'
        };
    }]);
