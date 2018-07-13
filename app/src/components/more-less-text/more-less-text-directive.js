angular.module('otDirectives')
    /**
     * Directive for the footer
     * This is mostly so the footer loads like the other page content and not before it.
     */
    .directive('otMoreLessText', [function () {
        'use strict';

        return {
            restrict: 'AE',
            scope: {
                data: '=',
                limit: '@'
            },
            templateUrl: 'src/components/more-less-text/more-less-text.html',
            link: function (scope, elem, attrs) {
                scope.cutoff = scope.limit;
            }
        };
    }]);
