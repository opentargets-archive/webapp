angular.module('otControllers')


    /**
     * DEPRECATED!
     * Controller for homepage stats. These are now included in the general page-controller.
     */
    .controller('StatsController', ['$scope', 'otApi', function ($scope, otApi) {
        'use strict';

        $scope.stats = {};

        otApi.getStats()
            .then(
                function (resp) {
                    // copy/expose repsonse to scope
                    _.forOwn(resp.body, function (value, key) {
                        $scope.stats[key] = value;
                    });

                    // count the datasources
                    var dbsctn = 0;

                    _.forOwn(resp.body.associations.datatypes, function (value, key) {
                        _.forOwn(value.datasources, function (v, k) {
                            dbsctn++;
                        });
                    });

                    $scope.stats.datasources = {
                        total: dbsctn
                    };

                    // how about release date?
                    var d = resp.body.data_version.split('.');
                    d[0] = '20' + d[0];   // format as "20xx"
                    d[1] = parseInt(d[1]) - 1; // month starts at 0
                    $scope.stats.date = new Date(d[0], d[1]); // expose as a Date object
                },
                otApi.defaultErrorHandler
            );
        // .finally(function(){
        //     $scope.search.loading = false;
        // });
    }]);
