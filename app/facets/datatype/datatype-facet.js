angular.module('otFacets')
    .directive('datatypeFacet', [function () {
        return {
            restrict: 'E',
            scope: {
                facet: '='
            },
            templateUrl: 'facets/datatype/datatype-facet.html'
        };
    }]);
