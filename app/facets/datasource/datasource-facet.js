angular.module('facets')

    /**
     * The Datasource facet
     */
    .directive('datasoruceFacet', ['$log', 'cttvFiltersService', function ($log, cttvFiltersService) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                facet: '='//,
                //partial: '@'
            },

            //templateUrl: 'facets/datasoruce/datatype-facet.html',
            template: '',   // not needed for now as datasources are only show under each datatype

            link: function (scope, elem, attrs) {},
        };
    }])

;