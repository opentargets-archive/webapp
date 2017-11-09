angular.module('otFacets')
    .factory('targetClassFacetParser', ['otNestedFacetParserGenerator', function (otNestedFacetParserGenerator) {
        return otNestedFacetParserGenerator.generate('target_class');
    }]);
