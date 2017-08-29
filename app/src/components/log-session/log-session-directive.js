angular.module('otDirectives')


    .directive('logSession', ['otAPIservice', function (otAPIservice) {
        'use strict';

        return {
            restrict: 'E',
            link: function () {
                otAPIservice.logSession();
            }
        };
    }]);
