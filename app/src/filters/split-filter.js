// TODO: could not find any usage of this directive... can it go?
angular.module('otFilters')
    .filter('otSplit', function () {
        'use strict';

        return function (input, splitChar, splitIndex) {
        // do some bounds checking here to ensure it has that index
            return input.split(splitChar)[splitIndex];
        };
    });
