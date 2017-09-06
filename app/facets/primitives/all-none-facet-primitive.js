angular.module('facets')
/**
 * "Select all / Clear all" controls for BooleanFilter facets
 * @param facet - The facet object
 */
    .directive('cttvAllNoneFacetPrimitive', [function () {
        return {
            restrict: 'E',
            scope: {
                facet: '='
            },
            templateUrl: 'facets/primitives/all-none-facet-primitive.html'
        };
    }]);
