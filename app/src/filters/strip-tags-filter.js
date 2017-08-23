angular.module('cttvFilters')
    .filter('stripTags', function() {
        'use strict';

        return function(text) {
            return  text ? String(text).replace(/<[^>]+>/gm, '') : '';
        };
    });
