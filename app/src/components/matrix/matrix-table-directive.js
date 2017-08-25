angular.module('cttvDirectives')
    /*
    *  Esssentially just a wrapper for the table tag, defined in hte template
    */
    .directive('otMatrixTable', [function () {
        'use strict';

        return {
            restrict: 'AE',
            template: '<table class="table matrix-table"></table>',
            replace: true
        };
    }]);
