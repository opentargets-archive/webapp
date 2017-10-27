angular.module('otFacets')
    /**
    * A directive for Checkbox facet with nested facets.
    */
    .directive('otUiIndeterminate', [function () {
        'use strict';
        return {
            restrict: 'AE',
            link: function (scope, elem, attrs) {
                if (!attrs.type || attrs.type.toLowerCase() !== 'checkbox') {
                    return angular.noop;
                }

                scope.$watch(attrs.otUiIndeterminate, function (newVal) {
                    elem[0].indeterminate = !!newVal;
                });
            }
        };
    }]);
