angular.module('otDirectives')


    .directive('logSession', ['otApi', function (otApi) {
        'use strict';

        return {
            restrict: 'E',
            link: function () {
                otApi.logSession();
            }
        };
    }]);
