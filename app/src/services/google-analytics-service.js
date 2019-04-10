/* Services */

angular.module('otServices')


    /** º
     * The Config service.
     * This stores global config variables for the font end
     */
    .factory('otGoogleAnalytics', ['$location', function ($location) {
        function trackPageView () {
            if (typeof ga !== 'undefined') {
                ga('send', 'pageview', $location.path());
            }
        }

        function trackEvent (category, action, label, value) {
            if (typeof ga !== 'undefined') {
                ga('send', 'event', category, action, label, value);
            }
        }

        return {
            trackPageView: trackPageView,
            trackEvent: trackEvent
        };
    }]);
