angular.module('otFacets')
    .directive('tractabilityFacet', [function () {
        return {
            restrict: 'E',
            scope: {
                facet: '='
            },
            templateUrl: 'facets/tractability/tractability-facet.html'
        };
    }]);
