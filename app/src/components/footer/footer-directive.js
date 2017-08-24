angular.module('cttvDirectives')
    /**
     * Directive for the footer
     * This is mostly so the footer loads like the other page content and not before it.
     */
    .directive('otFooter', [function () {
        'use strict';

        return {
            restrict: 'AE',
            templateUrl: 'src/components/footer/footer.html'
        };
    }]);
