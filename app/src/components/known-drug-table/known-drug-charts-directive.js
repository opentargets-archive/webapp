angular.module('otDirectives')
    .directive('otKnownDrugCharts', [function () {
        'use strict';

        return {
            restrict: 'AE',
            scope: {
                data: '='
            },
            templateUrl: 'src/components/known-drug-table/known-drug-charts.html'
        };
    }]);
