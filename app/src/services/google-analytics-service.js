/* Services */

angular.module('otServices')


    /**
     * The analytics service
     * Configures the functions used for tracking with Google Analytics
     */
    .factory('otGoogleAnalytics', ['$location', function ($location) {
        function trackPageView () {
            if ($location.host() === 'www.targetvalidation.org') {
                ga('send', 'pageview', $location.url());
            }
        }

        function trackEvent (category, action, label, value) {
            if ($location.host() === 'www.targetvalidation.org') {
                ga('send', 'event', category, action, label, value);
            }
        }

        return {
            trackPageView: trackPageView,
            trackEvent: trackEvent
        };
    }]);
