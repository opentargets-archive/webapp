angular.module('cttvControllers')

    .controller('OutreachCtrl', ['$scope', '$http', function ($scope, $http) {
        'use strict';

        $scope.day = moment();

        $http.get('https://opentargets.github.io/live-files/outreach.json')
            .then(function (resp) {
                if (angular.isObject(resp.data)) {
                    if (angular.isArray(resp.data.sessions)) {
                        $scope.sessions = resp.data.sessions;
                    }

                    // Differentiate between upcoming and past sessions

                    var upcoming = [];
                    var past = [];
                    for (var i = 0; i < resp.data.sessions.length; i++) {
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
                    $scope.past = past.sort(function (a, b) {
                        return moment(b.date).valueOf() - moment(a.date).valueOf();
                    });

                    $scope.slidesUrl = resp.data.slidesUrl;
                    $scope.videoUrl = resp.data.videoUrl;
                }
            });
    }]);
