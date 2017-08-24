angular.module('cttvFilters')
    .filter('otStripTags', function () {
        'use strict';

        return function (text) {
            return  text ? String(text).replace(/<[^>]+>/gm, '') : '';
        };
    });
