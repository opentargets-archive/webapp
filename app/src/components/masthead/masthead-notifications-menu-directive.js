
angular.module('cttvDirectives')
    /*
     * The notifications bell thingy in the navigation bar
     */
    .directive('mastheadNotificationsMenu', [function () {
        'use strict';

        return {
            restrict: 'AE',
            scope: {},

            template: ''
                        + '<div ng-cloak class="notification" ng-show="notificationsLeft" ng-controller="NotifyCtrl">'
                        + '     <div class="counter" ng-bind-html="notificationsLeft"></div>'
                        + '     <i ng-click="notify()" class="fa fa-bell" aria-hidden="true"></i>'
                        + '</div>'
        };
    }]);

