angular.module('otFacets')

    /**
    * Top level container for all the facets.
    * This contains accordion etc
    */
    .directive('facetLoader', ['$compile', function ($compile) {
        'use strict';

        return {

            restrict: 'AE',

            scope: {
                'plugin': '@',
                'facet': '='
            },

            link: function (scope, elem) {
                var template = '<' + scope.plugin + ' facet=facet></' + scope.plugin + '>';
                var compiled = $compile(template)(scope);
                elem.append(compiled);
            }

        };
    }]);
