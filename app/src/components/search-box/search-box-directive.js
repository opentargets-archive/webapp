angular.module('cttvDirectives')
    /**
     * The searchbox with search suggestions
     */
    .directive('otSearchBox', [function () {
        'use strict';

        return {
            restrict: 'AE',
            scope: {},
            templateUrl: 'src/components/search-box/search-box.html'
        };
    }]);
