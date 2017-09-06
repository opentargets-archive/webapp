angular.module('facets')
    .directive('pathwayFacet', [function () {
        return {
            restrict: 'E',
            scope: {
                facet: '='
            },
            templateUrl: 'facets/pathway/pathway-facet.html'
        };
    }]);
