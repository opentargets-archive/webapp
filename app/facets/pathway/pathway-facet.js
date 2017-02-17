angular.module('facets')

    /**
     * The Pathway facet
     */
    .directive('pathwayFacet', ['$log' , function ($log) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                facet: '=',
                partial: '@'
            },

            templateUrl: 'directives/generic-nested-facetcollection.html',

            link: function (scope, elem, attrs) {}
        };
    }])
;