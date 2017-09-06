angular.module('otFacets')
    .directive('targetClassFacet', [function () {
        return {
            restrict: 'E',
            scope: {
                facet: '='
            },
            templateUrl: 'facets/target-class/target-class-facet.html'
        };
    }]);
