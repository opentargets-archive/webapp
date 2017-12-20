angular.module('otControllers')
    /**
     * A generic page controller;
     * Can be used to pass common variables, constants or services to all pages
     */
    .controller('PageController', ['$scope', 'otConfig', 'otDictionary', 'otConsts', '$location', function ($scope, otConfig, otDictionary, otConsts, $location) {
        'use strict';
        $scope.otConfig = otConfig;
        $scope.otDictionary = otDictionary;
        $scope.otConsts = otConsts;
        $scope.location = $location;
    }]);

