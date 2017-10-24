angular.module('otControllers')
    /**
     * A generic page controller;
     * Can be used to pass common variables, constants or services to all pages
     */
    .controller('PageController', ['$scope', 'otConfig', 'otDictionary', 'otConsts', function ($scope, otConfig, otDictionary, otConsts) {
        'use strict';
        $scope.otConfig = otConfig;
        $scope.otDictionary = otDictionary;
        $scope.otConsts = otConsts;
    }]);

