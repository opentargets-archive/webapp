// TODO: otLocationState is needed here to ensure it picks up the initial page load's
// $locationChangeSuccess event, so that the facets respond to url changes.
// It would be better to clearly specify otLocationState's init code and trigger on app load.
/* eslint-disable angular/di-unused */
angular.module('otControllers')

    /**
     * Simple controller to expose the current page to the feedback button controller
     */
    .controller('FeedbackController', ['$scope', '$location', 'otLocationState', function ($scope, $location, otLocationState) {
        'use strict';
        // expose the location;
        // note that exposing the page as $location.absUrl() does not work as that would not update when URL changes
        $scope.location = $location;
        $scope.showSocialMedia = false;

        // perhaps we should use our locationstate service instead?
        $scope.$on('$locationChangeSuccess', function () {
            // when the location is back to the homepage, we hide the social media icons and show the "follow us" instead...
            if ($location.path() === '/') {
                $scope.showSocialMedia = false;
            }
        });
    }]);

