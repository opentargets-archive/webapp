// TODO: Note the following eslint rules are disabled for this file
// temporarily, since the facets are being worked on in a separate branch
/* eslint-disable angular/file-name */
/* eslint-disable angular/directive-name */
/* eslint-disable angular/directive-restrict */

/**
 * Module for all general/common facets directives
 */


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
    }])


    /**
    * Top level container for all the facets.
    * This contains accordion etc
    */
    .directive('otFacets', ['otFacetsFilters', function (otFacetsFilters) {
        'use strict';

        return {

            restrict: 'AE',

            scope: {},

            templateUrl: 'src/components/facets/facets.html',

            link: function (scope) {
                // scope.dataDistribution =
                scope.filters = otFacetsFilters.getFilters();
                scope.selectedFilters = otFacetsFilters.getSelectedFilters();
                scope.deselectAll = otFacetsFilters.deselectAll;

                // scope.respStatus = 1; //otFacetsFilters.status(); // TODO: handle response status
                // scope.updateFilter = function(id){
                //    otFacetsFilters.getFilter(id).toggle();
                // }
            }

        };
    }])


    /**
    * A directive for Checkbox facet with nested facets.
    */
    .directive('otUiIndeterminate', [function () {
        'use strict';

        return {

            restrict: 'AE',

            link: function (scope, elem, attrs) {
                if (!attrs.type || attrs.type.toLowerCase() !== 'checkbox') {
                    return angular.noop;
                }

                scope.$watch(attrs.otUiIndeterminate, function (newVal) {
                    elem[0].indeterminate = !!newVal;
                });
            }
        };
    }]);

