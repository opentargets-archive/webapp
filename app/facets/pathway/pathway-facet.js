angular.module('facets')
    .directive('pathwayFacet', ['$log', function ($log) {
        return {
            restrict: 'E',
            scope: {
                facet: '='
            },
            templateUrl: 'facets/pathway/pathway-facet.html'
        };
    }]);
