angular.module('cttvDirectives')
    .directive('cttvBetaRibbon', ['$location', function ($location) {
        'use strict';
        return {
            restrict: 'E',
            scope: {},
            template: '<div ng-show="display" id="cttv-beta-ribbon" class="cttv-beta-ribbon">{{host}}</div>',
            link: function (scope) {
                var host = $location.host();
                scope.host = host.split('.')[0];
                if (host === 'www.targetvalidation.org' || host === 'targetvalidation.org') {
                    scope.display = false;
                } else {
                    scope.display = true;
                }
            }
        };
    }]);
