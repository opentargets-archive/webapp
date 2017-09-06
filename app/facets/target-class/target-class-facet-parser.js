angular.module('facets')
    .factory('targetClassFacetParser', ['nestedFacetParserGenerator', function (nestedFacetParserGenerator) {
        return nestedFacetParserGenerator.generate('target_class');
    }]);
