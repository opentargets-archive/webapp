angular.module('facets')
    .factory('therapeuticAreaFacetParser', ['flatFacetParserGenerator', function (flatFacetParserGenerator) {
        return flatFacetParserGenerator.generate(false);
    }]);
