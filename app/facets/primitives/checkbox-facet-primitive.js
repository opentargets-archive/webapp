angular.module('facets')
.directive('cttvCheckboxFacetPrimitive', [function () {
  return {
    restrict: 'E',
    scope: {
      filter: '=',
      multiline: '@?'
    },
    templateUrl: 'facets/primitives/checkbox-facet-primitive.html'
  };
}])