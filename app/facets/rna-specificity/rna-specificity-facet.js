angular.module('otFacets')
    .directive('rnaSpecificityFacet', [function () {
        return {
            restrict: 'E',
            scope: {
                facet: '='
            },
            templateUrl: 'facets/rna-specificity/rna-specificity-facet.html'
        };
    }]);
