  /* Controllers */

    angular.module('cttvControllers', [])
    .run (['$rootScope', '$window', function ($rootScope, $window) {
        'use strict';
        $rootScope.showApiErrorMsg = false;
        $rootScope.$on("cttvApiError", function (event, data) {
            if (data.status === 403) {
                $rootScope.showApiErrorMsg = true;
            }
        });
        $rootScope.showApiError500 = false;
        $rootScope.reloadPage = function () {
            $window.location.reload();
        };
    }])



    .controller('MastheadCtrl', ['$scope', '$location', '$log', 'cttvLocationState', function ($scope, $location, $log, cttvLocationState) {
        'use strict';
        $log.log('MastheadCtrl()');
        $scope.location = $location;

    }]);


