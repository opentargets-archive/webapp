angular.module('facets')

    /**
    * The therapeutic areas facet
    */
    .directive('therapeuticAreaFacet', [function () {
        'use strict';

        return {
            restrict: 'AE',
            scope: {
                facet: '='
            },
            templateUrl: 'directives/generic-facetcollection.html'
        };
    }]);

