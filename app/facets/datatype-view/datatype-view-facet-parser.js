angular.module('otFacets')
    .factory('datatypeViewFacetParser', ['datatypeFacetParser', function (datatypeFacetParser) {
        // use the same parser as for regular datatype
        return {
            parse: datatypeFacetParser.parse
        };
    }]);
