angular.module('facets')
    .factory('therapeuticAreaFacetParser', ['$log', 'flatFacetParserGenerator', function ($log, flatFacetParserGenerator) {
        return flatFacetParserGenerator.generate(false);
    }]);
