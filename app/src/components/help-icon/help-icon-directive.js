angular.module('cttvDirectives')
    .directive('otHelpIcon', [function () {
        'use strict';

        return {
            restrict: 'AE',
            scope: {
                href: '@'
            },
            templateUrl: 'src/components/help-icon/help-icon.html'
        };
    }]);
