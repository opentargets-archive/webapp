angular.module('cttvControllers')

.controller('OutreachCtrl', ['$scope', '$log', '$http', function ($scope, $log, $http) {
    'use strict';

    $scope.day = moment();

    $http.get("/training.json")
        .then (function (resp) {
            if (angular.isObject(resp.data)) {
                if (angular.isArray(resp.data.sessions)) {
                    $scope.sessions = resp.data.sessions;
                    // var eventDays = [];
                    // for (var i=0; i<$scope.sessions.length; i++) {
                    //     var event = $scope.sessions[i];
                    //     eventDays.push(event.date);
                        // $scope.marked = eventDays;
                    // }
                }
            }
        });
}]);
