angular.module('facets')
    .factory('pathwayFacetParser', ['nestedFacetParserGenerator', function (nestedFacetParserGenerator) {
        return nestedFacetParserGenerator.generate('pathway');
    }]);
