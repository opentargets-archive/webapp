angular.module('otDirectives')
    .directive('otLinkListH', [function () {
        'use strict';

        return {
            restrict: 'AE',
            scope: {
                list: '='
            },
            replace: false,
            template: '<span ng-repeat="source in list"><a href="{{source.url}}" target="_blank">{{source.label}}</a><span ng-if="!$last">, </span><span>',
            link: function (scope) {}
        };
    }]);
