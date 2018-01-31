angular.module('otDirectives')
    .directive('otPopover', ['otDefinitions', '$sce', function (otDefinitions, $sce) {
        'use strict';

        return {
            restrict: 'E',
            scope: {
                key: '@'
            },
            template: '<span ng-if="link" uib-popover-template="\'src/components/popover/popover.html\'" popover-animation="true" popover-trigger="\'mouseenter\'"><a target=_blank ng-click="$event.stopPropagation()" href="{{link}}"><i class="fa fa-question-circle"></i></a></span>' +
        '<span ng-if="!link" uib-popover-template="\'src/components/popover/popover.html\'" popover-animation="true" popover-trigger="\'mouseenter\'" ng-click="$event.stopPropagation()" style="margin-left:8px;"><i class="fa fa-question-circle"></i></span>',

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
