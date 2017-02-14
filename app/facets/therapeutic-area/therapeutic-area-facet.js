angular.module('facets')

    /**
    * The therapeutic areas facet
    */
    .directive('cttvTherapeuticAreaFacet', ['$log', function ($log) {
        'use strict';

        return {
            restrict: 'EA',
            scope: {
                facet: '=',
                partial: '@'
            },
            templateUrl: 'directives/generic-facetcollection.html',

            link: function (scope, elem, attrs) {
                $log.log("Bob!");
            },
        };
    }])

;



