angular.module('otFacets')
    .directive('cttvNestedCheckboxFacetPrimitive', ['RecursionHelper', function (RecursionHelper) {
        return {
            restrict: 'E',
            scope: {
                filter: '='
            },
            templateUrl: 'facets/primitives/nested-checkbox-facet-primitive.html',
            compile: function (element) {
                // using a recursive template, which angular cannot ordinarily handle
                return RecursionHelper.compile(element);
            }
        };
    }]);
