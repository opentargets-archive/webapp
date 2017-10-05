angular.module('otDirectives')


    .directive('otLogSession', ['otApi', function (otApi) {
        'use strict';

        return {
            restrict: 'E',
            link: function () {
                otApi.logSession();
            }
        };
    }]);
