angular.module('facets')
    .factory('pathwayFacetParser', ['otNestedFacetParserGenerator', function (otNestedFacetParserGenerator) {
        return otNestedFacetParserGenerator.generate('pathway');
    }]);
