angular.module('otFilters')
    .filter('otEllipseText', function () {
        'use strict';

        return function (text, length) {
            return  text.length > length ? text.substring(0, length) + '&hellip;' : text;
        };
    });
