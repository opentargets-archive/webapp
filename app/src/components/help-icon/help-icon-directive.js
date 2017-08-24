angular.module('cttvDirectives')
    .directive('cttvHelpIcon', [function () {
        'use strict';

        return {
            restrict: 'AE',
            scope: {
                href: '@'
            },
            template: '<a href="{{href}}"><span class="fa fa-question-circle"></span></a>'
        };
    }]);
