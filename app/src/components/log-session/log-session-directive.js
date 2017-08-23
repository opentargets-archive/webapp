angular.module('cttvDirectives')


    .directive('logSession', ['cttvAPIservice', function (cttvAPIservice) {
        'use strict';

        return {
            restrict: 'E',
            link: function () {
                cttvAPIservice.logSession();
            }
        };
    }]);
