angular.module('otFacets')
    .directive('therapeuticAreaFacet', [function () {
        return {
            restrict: 'E',
            scope: {
                facet: '='
            },
            templateUrl: 'facets/therapeutic-area/therapeutic-area-facet.html'
        };
    }]);
