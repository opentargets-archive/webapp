angular.module('otFacets')
    /**
    * Top level container for all the facets.
    * This contains accordion etc
    */
    .directive('otFacets', ['otFacetsFilters', function (otFacetsFilters) {
        'use strict';

        return {

            restrict: 'AE',

            scope: {},

            templateUrl: 'src/components/facets/facets.html',

            link: function (scope) {
                // scope.dataDistribution =
                scope.filters = otFacetsFilters.getFilters();
                scope.selectedFilters = otFacetsFilters.getSelectedFilters();
                scope.deselectAll = otFacetsFilters.deselectAll;

                // scope.respStatus = 1; //otFacetsFilters.status(); // TODO: handle response status
                // scope.updateFilter = function(id){
                //    otFacetsFilters.getFilter(id).toggle();
                // }
            }

        };
    }]);
