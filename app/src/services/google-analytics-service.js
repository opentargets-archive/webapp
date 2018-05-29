/* Services */

angular.module('otServices')


    /** º
     * The Config service.
     * This stores global config variables for the font end
     */
    .factory('otGoogleAnalytics', ['$location', function ($location) {
        function trackPageView () {
            if ($location.host() === 'www.targetvalidation.org') {
                ga('send', 'pageview', $location.path());
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
