angular.module('facets')
.directive('rnaExpressionFacet', ['$log', function ($log) {
  return {
    restrict: 'E',
    scope: {
      facet: '='
    },
    templateUrl: 'facets/rna-expression/rna-expression-facet.html',
  };
}]);
