angular.module('otDirectives')
    .directive('otBetaRibbon', ['$location', function ($location) {
        'use strict';
        return {
            restrict: 'E',
            scope: {},
            template: '<div ng-show="display" id="ot-beta-ribbon" class="ot-beta-ribbon">{{host}}</div>',
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
