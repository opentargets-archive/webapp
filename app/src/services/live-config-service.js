angular.module('cttvServices')
    .factory ('liveConfig', ['$log', '$http', function ($log, $http) {
        'use strict';
        return $http.get('/config/live.json')
            .then (function (resp) {
                return resp.data;
            });
    }]);
