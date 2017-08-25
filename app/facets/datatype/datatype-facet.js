angular.module('facets')

    /**
     * The Datatypes facet
     */
    .directive('datatypeFacet', [function () {
        'use strict';

        return {
            restrict: 'AE',
            scope: {
                facet: '='
            },
            // templateUrl: 'facets/datatype/datatype-facet.html',
            templateUrl: 'directives/generic-nested-facetcollection.html'
        };
    }]);
