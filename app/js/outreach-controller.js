angular.module('cttvControllers')

.controller('OutreachCtrl', ['$scope', '$log', '$http', function ($scope, $log, $http) {
    'use strict';
    $http.get("/training.json")
        .then (function (resp) {
            if (angular.isObject(resp.data)) {
                if (angular.isArray(resp.data.sessions)) {
                    $scope.sessions = resp.data.sessions;
                }
            }
        });
}]);
