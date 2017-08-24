angular.module('cttvDirectives')
    .directive('cttvHelpIcon', [function () {
        'use strict';

        return {
            restrict: 'AE',
            scope: {
                href: '@'
            },
            templateUrl: 'src/components/help-icon/help-icon.html'
        };
    }]);
