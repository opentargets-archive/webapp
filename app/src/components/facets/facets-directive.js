angular.module('otFacets')
    /**
    * Top level container for all the facets.
    * This contains accordion etc
    */
    .directive('otFacets', ['otFacetsState', function (otFacetsState) {
        'use strict';

        return {
            restrict: 'AE',
            scope: {},
            templateUrl: 'src/components/facets/facets.html',
            link: function (scope) {
                scope.facets = otFacetsState.getPageFacets();
            }
        };
    }]);
