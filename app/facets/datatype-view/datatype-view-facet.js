angular.module('otFacets')
    .directive('datatypeViewFacet', [function () {
        return {
            restrict: 'E',
            scope: {
                facet: '='
            },
            templateUrl: 'facets/datatype-view/datatype-view-facet.html',
            link: function () {}
        };
    }]);
