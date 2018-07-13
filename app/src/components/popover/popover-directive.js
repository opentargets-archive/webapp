angular.module('otDirectives')
    .directive('otPopover', ['otDefinitions', '$sce', function (otDefinitions, $sce) {
        'use strict';

        return {
            restrict: 'E',
            scope: {
                key: '@'
            },
            templateUrl: 'src/components/popover/popover.html',
            link: function (scope) {
                var def = otDefinitions[scope.key];
                if (def) {
                    scope.content = $sce.trustAsHtml(def.description);
                    scope.link = def.link;
                } else {
                    scope.content = '';
                }
            }

        };
    }]);
