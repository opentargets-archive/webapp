angular.module('otFacets')
    .factory('therapeuticAreaFacetParser', ['otFlatFacetParserGenerator', function (otFlatFacetParserGenerator) {
        return otFlatFacetParserGenerator.generate(false);
    }]);
