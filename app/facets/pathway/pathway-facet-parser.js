angular.module('facets')
.factory('pathwayFacetParser', ['$log', 'nestedFacetParserGenerator', function($log, nestedFacetParserGenerator) {
  return nestedFacetParserGenerator.generate('pathway');
}]);