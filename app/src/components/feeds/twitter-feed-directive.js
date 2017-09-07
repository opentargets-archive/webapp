angular.module('otDirectives')
    .directive('otTwitterFeed', ['$log', function ($log) {
        'use strict';

        return {
            restrict: 'AE',
            scope: {},
            templateUrl: 'src/components/feeds/twitter-feed.html',
            link: function () {
                try {
                    twttr.widgets.load();
                } catch (e) {
                    $log.warn('Cannot load Twitter feed - possibly missing twttr.widgets script');
                }
            }
        };
    }]);
