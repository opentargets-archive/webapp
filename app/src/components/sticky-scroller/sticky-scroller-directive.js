
angular.module('cttvDirectives')

    /**
     * This directive exposes the page scroll, so it can, for example,
     * be used to create nav bars that become sticky as the user scrolls the page
     * @param scroll-position - the name of the variable to hold the scroll amount
     * Example:
     *  <div ot-sticky-scroller scroll-position="scroll" ng-class="scroll>80 ? 'fixed' : ''">
     *      Hello
     *  </div>
     */
    .directive('otStickyScroller', ['$window', function ($window) {
        'use strict';

        return {
            restrict: 'AE',
            scope: {
                scroll: '=scrollPosition'
            },
            link: function (scope) {
                var windowEl = angular.element($window);
                var handler = function () {
                    scope.scroll = windowEl[0].scrollY;
                };
                windowEl.on('scroll', scope.$apply.bind(scope, handler));
                handler();
            }
        };
    }]);
