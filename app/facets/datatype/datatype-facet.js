angular.module('facets')

    /**
     * The Datatypes facet
     */
    .directive('datatypeFacet', ['$log', 'cttvFiltersService', function ($log, cttvFiltersService) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                facet: '='
            },

            //templateUrl: 'facets/datatype/datatype-facet.html',
            templateUrl: 'directives/generic-nested-facetcollection.html',

            link: function (scope, elem, attrs) {},
        };
    }])

;