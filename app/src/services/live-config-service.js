angular.module('otServices')
    .factory('liveConfig', ['$http', function ($http) {
        'use strict';
        return $http.get('/config/live.json')
            .then(function (resp) {
                return resp.data;
            });
    }]);
