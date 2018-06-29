angular.module('otControllers')
    /**
     * A generic page controller;
     * Can be used to pass common variables, constants or services to all pages
     */
    .controller('PageController', ['$scope', 'otConfig', 'otDictionary', 'otConsts', 'otApi', function ($scope, otConfig, otDictionary, otConsts, otApi) {
        'use strict';

        // we should probably use $rootScope for these things

        $scope.otConfig = otConfig;
        $scope.otDictionary = otDictionary;
        $scope.otConsts = otConsts;

        $scope.dataStats = {};
        otApi.getStats()
            .then(
                function (resp) {
                    // copy/expose repsonse to scope
                    _.forOwn(resp.body, function (value, key) {
                        $scope.dataStats[key] = value;
                    });

                    // count the datasources
                    var dbsctn = 0;

                    _.forOwn(resp.body.associations.datatypes, function (value, key) {
                        _.forOwn(value.datasources, function (v, k) {
                            dbsctn++;
                        });
                    });

                    $scope.dataStats.datasources = {
                        total: dbsctn
                    };

                    // release date and version
                    var d = resp.body.data_version.split('.');
                    d[0] = '20' + d[0];   // format as "20xx"
                    d[1] = parseInt(d[1]) - 1; // month starts at 0
                    $scope.dataStats.date = new Date(d[0], d[1]); // expose as a Date object
                    $scope.dataStats.version = resp.body.data_version;
                },
                otApi.defaultErrorHandler
            );
    }]);

