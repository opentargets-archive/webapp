angular.module('cttvDirectives')
    /**
     * Directive for the footer
     * This is mostly so the footer loads like the other page content and not before it.
     */
    .directive('otMoreLessText', ['$log', function ($log) {
        'use strict';

        return {
            restrict: 'AE',
            scope: {
                data: '=',
                limit: '@'
            },
            template: '<span>{{data | limitTo: limit }}</span>'
                      + '<span ng-if="data.length>limit" ng-init="expd=false">'
                      +     '<span ng-show="!expd" ng-click="expd=!expd"> &hellip; <a>[show more]</a></span>'
                      +     '<span ng-show="expd">{{data | limitTo: data.length:limit }}<span ng-click="expd=!expd"> <a>[show less]</a></span></span>'
                      + '</span>',
            link: function (scope) {
                $log.log(scope);
            }
        };
    }]);
