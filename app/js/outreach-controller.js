angular.module('cttvControllers')

.controller('OutreachCtrl', ['$scope', '$log', '$http', function ($scope, $log, $http) {
    'use strict';

    $scope.day = moment();
    var pastLimit = moment().subtract(3, 'months'); // 3 months old

    $scope.showAll = false;
    function filterBeforeLimit () {
        return $scope.allPast.filter(function (d) {
           return pastLimit.isBefore(d.date);
        });
    }

    $scope.togglePast = function() {
        if ($scope.showAll) {
            $scope.past = filterBeforeLimit();
        } else {
            $scope.past = $scope.allPast;
        }
        $scope.showAll = !$scope.showAll;
    };

    $http.get("https://opentargets.github.io/live-files/outreach.json")
        .then (function (resp) {
            if (angular.isObject(resp.data)) {
                if (angular.isArray(resp.data.sessions)) {
                    $scope.sessions = resp.data.sessions;
                }

                // Differentiate between upcoming and past sessions
                var upcoming = [];
                var past = [];
                for (var i=0; i<resp.data.sessions.length; i++) {
                    var session = resp.data.sessions[i];
                    if ($scope.day.isBefore(session.date)) {
                        upcoming.push(session);
                    } else {
                        past.push(session);
                    }
                }
                $scope.upcoming = upcoming.sort(function (a, b) {
                    return moment(a.date).valueOf() - moment(b.date).valueOf();
                });
                $scope.allPast = past.sort(function (a, b) {
                    return moment(b.date).valueOf() - moment(a.date).valueOf();
                });
                $scope.past = filterBeforeLimit();

                $scope.slidesUrl = resp.data.slidesUrl;
                $scope.videoUrl = resp.data.videoUrl;
            }
        });
}]);
