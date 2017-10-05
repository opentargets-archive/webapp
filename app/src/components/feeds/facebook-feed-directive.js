angular.module('otDirectives')
    .directive('otFacebookFeed', ['$log', function ($log) {
        'use strict';

        return {
            restrict: 'AE',
            scope: {},
            templateUrl: 'src/components/feeds/facebook-feed.html',
            link: function () {
                try {
                    FB.XFBML.parse();
                } catch (e) {
                    $log.warn('Cannot load Facebook feed');
                }
            }
        };
    }]);
