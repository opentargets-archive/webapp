angular.module('facets')

    /**
    * The therapeutic areas facet
    */
    .directive('therapeuticAreaFacet', ['$log', function ($log) {
        'use strict';

        return {
            restrict: 'EA',
            scope: {
                facet: '='
            },
            templateUrl: 'directives/generic-facetcollection.html',

            link: function (scope, elem, attrs) {},
        };
    }])

;



