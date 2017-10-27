angular.module('otDirectives')
    .directive('otSourceList', [function () {
        'use strict';

        return {
            restrict: 'AE',
            scope: {
                list: '='
            },
            replace: false,
            template: '<p>Source: <ot-link-list-h list="list"></ot-link-list-h></p>',
            link: function () {}
        };
    }]);
