angular.module('otDirectives')
    /*
    * This creates a light-box style div with a spinner.
    * The spinner is automatically visible when there are *any* pending requests
    * Options:
    * size: as per cttvProgressSpinner; Default is 3.
    */
    .directive('otPageProgressSpinner', ['otApi', function (otApi) {
        'use strict';

        return {
            restrict: 'AE',
            // template: '<div class="page-progress-spinner" ng-show="isloading"><span ot-progress-spinner class="text-lowlight fa-{{size}}x"></span></div>',
            template: '<div class="page-progress-spinner" ng-show="isloading"><span ot-progress-spinner size="50" stroke="3" class="text-lowlight"></span></div>',
            scope: {
                size: '@',
                isloading: '=?'
            },
            link: function (scope) {
                if (!scope.isloading) {
                    scope.$watch(function () { return otApi.activeRequests; }, function (newValue) {
                        scope.isloading = newValue > 0;
                    });
                }
                // else it means we've passed a variable to use as flag to show/hide the spinner...
            }
        };
    }]);
