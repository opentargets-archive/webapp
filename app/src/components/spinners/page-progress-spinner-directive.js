angular.module('cttvDirectives')
    /*
    * This creates a light-box style div with a spinner.
    * The spinner is automatically visible when there are *any* pending requests
    * Options:
    * size: as per cttvProgressSpinner; Default is 3.
    */
    .directive('cttvPageProgressSpinner', ['$log', 'cttvAPIservice', function ($log, cttvAPIservice) {
        'use strict';

        return {
            restrict: 'AE',
            // template: '<div class="page-progress-spinner" ng-show="isloading"><span cttv-progress-spinner class="text-lowlight fa-{{size}}x"></span></div>',
            template: '<div class="page-progress-spinner" ng-show="isloading"><span cttv-progress-spinner size="50" stroke="3" class="text-lowlight"></span></div>',
            scope: {
                size: '@'
            },
            link: function (scope, elem, attrs) {
                scope.$watch(function () {return cttvAPIservice.activeRequests;}, function (newValue, oldValue) {
                    scope.isloading = newValue > 0;
                });
            }
        };
    }]);
