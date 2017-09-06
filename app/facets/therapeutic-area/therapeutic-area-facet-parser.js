angular.module('facets')
    .factory('therapeuticAreaFacetParser', ['otFlatFacetParserGenerator', function (otFlatFacetParserGenerator) {
        return otFlatFacetParserGenerator.generate(false);
    }]);
