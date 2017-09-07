angular.module('otFilters')
    .filter('otUpperCaseFirst', function () {
        'use strict';

        return function (input) {
            return input.charAt(0).toUpperCase() + input.slice(1);
        };
    });
