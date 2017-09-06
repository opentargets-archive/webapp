angular.module('facets')
    .directive('rnaExpressionFacet', [function () {
        return {
            restrict: 'E',
            scope: {
                facet: '='
            },
            templateUrl: 'facets/rna-expression/rna-expression-facet.html'
        };
    }]);
