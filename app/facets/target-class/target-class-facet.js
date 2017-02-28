angular.module('facets')

    /**
     * The Target class facet
     */
    .directive('targetClassFacet', ['$log' , function ($log) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                facet: '='
            },

            templateUrl: 'directives/generic-nested-facetcollection.html',

            link: function (scope, elem, attrs) {}
        };
    }])
;