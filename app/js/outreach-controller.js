angular.module('cttvControllers')

.controller('OutreachCtrl', ['$scope', '$log', '$http', function ($scope, $log, $http) {
    'use strict';

    $scope.day = moment();

    $http.get("//cttv.github.io/live-files/outreach.json")
        .then (function (resp) {
            if (angular.isObject(resp.data)) {
                if (angular.isArray(resp.data.sessions)) {
                    $scope.sessions = resp.data.sessions;
                }
                $scope.slidesUrl = resp.data.slidesUrl;
                $scope.videoUrl = resp.data.videoUrl;
            }
        });
}]);
