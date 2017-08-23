angular.module('cttvDirectives')
    .directive('otPopover', ['$log', 'otDefinitions', function ($log, otDefinitions) {
        'use strict';

        return {
            restrict: 'E',
            scope: {
                key: '@'
            },
            template: '<span ng-if="link" uib-popover-template="\'src/components/popover/popover.html\'" popover-animation="true" popover-trigger="\'mouseenter\'"><a target=_blank ng-click="$event.stopPropagation()" href="{{link}}"><i class="fa fa-info-circle"></i></a></span>' +
        '<span ng-if="!link" uib-popover-template="\'src/components/popover/popover.html\'" popover-animation="true" popover-trigger="\'mouseenter\'" ng-click="$event.stopPropagation()" style="margin-left:8px;"><i class="fa fa-info-circle"></i></span>',

            link: function (scope, el, attrs) {
                var def = otDefinitions[scope.key];
                if (def) {
                    scope.content = def.description;
                    scope.link = def.link;
                } else {
                    scope.content = '';
                }
            }

        };
    }]);
