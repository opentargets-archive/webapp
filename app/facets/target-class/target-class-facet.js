angular.module('facets')

    /**
     * The Target class facet
     */
    .directive('cttvTargetClassFacet', ['$log' , function ($log) {
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