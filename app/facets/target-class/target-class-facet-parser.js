angular.module('facets')
    .factory('targetClassFacetParser', ['$log', 'nestedFacetParserGenerator', function ($log, nestedFacetParserGenerator) {
        return nestedFacetParserGenerator.generate('target_class');
    }]);
