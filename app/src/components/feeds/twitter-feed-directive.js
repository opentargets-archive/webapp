angular.module('cttvDirectives')
    .directive('cttvTwitterFeed', ['$log', function ($log) {
        'use strict';

        return {
            restrict: 'AE',
            scope: {},
            template: '<a class="twitter-timeline"'
                        + 'data-lang="en"'
                        + 'data-theme="light"'
                        + 'href="https://twitter.com/targetvalidate"'
                        // +'data-tweet-limit="3"'
                        + 'data-height="400px"'
                        + 'data-chrome="noborders noheader nofooter"'
                        + '>Tweets by targetvalidate</a>',
            link: function (scope, element, attrs) {
                try {
                    twttr.widgets.load();
                } catch (e) {
                    $log.warn('Cannot load Twitter feed - possibly missing twttr.widgets script');
                }
            }
        };
    }]);
