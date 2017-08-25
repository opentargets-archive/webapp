angular.module('cttvControllers')

    /**
     * Controller for the masthead navigations
     * Simply exposes the location service
     */
    .controller('MastheadCtrl', ['$scope', '$location', function ($scope, $location) {
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
