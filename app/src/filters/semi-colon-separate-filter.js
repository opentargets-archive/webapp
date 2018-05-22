angular.module('otFilters')
    .filter('otSemiColonSeparate', function () {
        'use strict';

        return function (inputArray) {
            return inputArray.join('; ');
        };
    });
