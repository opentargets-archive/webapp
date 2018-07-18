angular.module('otControllers')
    /**
     * A generic page controller;
     * Can be used to pass common variables, constants or services to all pages
     */
    .controller('PageController', ['$scope', 'otConfig', 'otDictionary', 'otConsts', 'otApi', '$location', function ($scope, otConfig, otDictionary, otConsts, otApi, $location) {
        'use strict';

        // we should probably use $rootScope for these things

        $scope.otConfig = otConfig;
        $scope.otDictionary = otDictionary;
        $scope.otConsts = otConsts;
        $scope.location = $location;

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

        // TODO: this is for the intro page only; it should probably be moved to its own controller
        // it picks a random search example from the config, to be displaied in the homepage
        $scope.introTryExamples = {
            targets: [],
            diseases: []
        };
        while ($scope.introTryExamples.targets.length < 2) {
            // pick a random target from the predefined list
            var n = Math.floor(Math.random() * (otConfig.searchExamples.targets.length - 1));
            // but make sure it hasnt' already be selected:
            // for one it would look wrong to see the same example repeated (e.g. "BRAF BRAF")
            // but this also causes Angular to throw an error (ng-repeat keys must be unique)
            if ($scope.introTryExamples.targets.lastIndexOf(n) === -1) {
                $scope.introTryExamples.targets.push(n);
            }
        }
        while ($scope.introTryExamples.diseases.length < 2) {
            var n = Math.floor(Math.random() * (otConfig.searchExamples.diseases.length - 1));
            if ($scope.introTryExamples.diseases.lastIndexOf(n) === -1) {
                $scope.introTryExamples.diseases.push(n);
            }
        }
    }]);

