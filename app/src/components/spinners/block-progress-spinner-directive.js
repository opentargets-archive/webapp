angular.module('otDirectives')
    /*
    * This creates a light-box style div with a spinner.
    * Options:
    * isloading: variable to use for hiding/showing
    * size: the size (diameter), in pixels. Defaults to 50. Optional.
    * stroke: the thickness of the line, in pixels. Defaults to 3. Optional.
    */
    .directive('otBlockProgressSpinner', [function () {
        'use strict';

        return {
            restrict: 'AE',
            template: '<div class="block-progress-spinner" ng-show="isloading"><ot-progress-spinner size="{{size || 50}}" stroke="{{stroke || 3}}" class="text-lowlight"></ot-progress-spinner></div>',
            scope: {
                size: '@?',
                stroke: '@?',
                isloading: '='
            }
        };
    }]);
