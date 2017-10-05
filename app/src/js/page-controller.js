angular.module('otControllers')
    /**
     * A generic page controller;
     * Can be used to pass common variables, constants or services to all pages
     */
    .controller('PageController', ['$scope', 'otConfig', function ($scope, otConfig) {
        'use strict';
        $scope.otConfig = otConfig;
    }]);

