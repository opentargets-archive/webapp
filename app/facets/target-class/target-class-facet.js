angular.module('facets')

    /**
     * The Target class facet
     */
    .directive('targetClassFacet', [function () {
        'use strict';

        return {
            restrict: 'AE',
            scope: {
                facet: '='
            },
            templateUrl: 'directives/generic-nested-facetcollection.html'
        };
    }]);
