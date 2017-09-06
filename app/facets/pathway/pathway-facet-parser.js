angular.module('otFacets')
    .factory('pathwayFacetParser', ['otNestedFacetParserGenerator', function (otNestedFacetParserGenerator) {
        return otNestedFacetParserGenerator.generate('pathway');
    }]);
