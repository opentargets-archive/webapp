angular.module('otFacets')
    .directive('otCheckboxFacetPrimitive', [function () {
        return {
            restrict: 'E',
            scope: {
                filter: '=',
                multiline: '@?'
            },
            templateUrl: 'facets/primitives/checkbox-facet-primitive.html'
        };
    }]);
