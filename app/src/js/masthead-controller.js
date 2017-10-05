// TODO: otLocationState is needed here to ensure it picks up the initial page load's
// $locationChangeSuccess event, so that the facets respond to url changes.
// It would be better to clearly specify otLocationState's init code and trigger on app load.
/* eslint-disable angular/di-unused */
angular.module('otControllers')

    /**
     * Controller for the masthead navigations
     * Simply exposes the location service
     */
    .controller('MastheadController', ['$scope', '$location', 'otLocationState', function ($scope, $location, otLocationState) {
        'use strict';

        $scope.location = $location;

        // options must be exposed as an object, or else Angular doesn't update the view
        $scope.opts = {
            showResponsiveSearch: false
        };

        $scope.$on('$locationChangeSuccess', function () {
            // when we change page, close the search in case it's visible
            $scope.opts.showResponsiveSearch = false;
        });
    }]);
