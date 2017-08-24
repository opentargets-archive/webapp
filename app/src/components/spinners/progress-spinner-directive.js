angular.module('cttvDirectives')
    /*
    * A simple progress spinner using a fontawesome icon
    * Options:
    * size: size of the spinner icon; 18 is default
    * stroke: thickness of the "ring" default is 2
    */
    .directive('cttvProgressSpinner', [function () {
        'use strict';

        return {
            restrict: 'AE',
            template: '<span></span>',
            link: function (scope, elem, attrs) {
                var size = attrs.size || 18;
                var stroke = attrs.stroke || 2;
                var sp = spinner()
                    .size(size)
                    .stroke(stroke);
                sp(elem[0]);
            }
        };
    }]);
