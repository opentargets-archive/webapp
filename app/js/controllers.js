  /* Controllers */

    angular.module('cttvControllers', [])
    .run (['$rootScope', '$window', '$modalStack', function ($rootScope, $window, $modalStack) {
        'use strict';

        // Close all the modal windows when the route changes
        $rootScope.$on('$routeChangeSuccess', function (newVal, oldVal) {
            if (oldVal !== newVal) {
                $modalStack.dismissAll();
            }

            $rootScope.showApiErrorMsg = false;
            $rootScope.showApiError500 = false;
        });

        $rootScope.$on("cttvApiError", function (event, data) {
            if (data.status === 403) {
                $rootScope.showApiErrorMsg = true;
            }
        });
        $rootScope.reloadPage = function () {
            $window.location.reload();
        };
    }])

    .controller('MastheadCtrl', ['$scope', '$location', '$log', 'cttvLocationState', function ($scope, $location, $log, cttvLocationState) {
        'use strict';
        $log.log('MastheadCtrl()');
        $scope.location = $location;

    }])


    /**
    * Controller to allow notifications to the user
    */
    .controller('NotifyCtrl', ['$scope', '$log', '$http', '$modal', '$cookies', function ($scope, $log, $http, $modal, $cookies) {
        'use strict';
        $log.log(" NotifyCtrl ");
        // Default behaviour on icon click
        $scope.notify = function(){};
        $http.get('/notification.json')
            .then (function(partial) {
                console.log(partial);
                if (partial.data.id) { // There is a new notification
                    var thiscookie = $cookies.get(partial.data.id);
                    if (thiscookie) {
                        // We don't show the notifications icon
                        $scope.showNotify = false;
                        return;
                    }
                    $scope.showNotify = true;
                    var currMs = Date.now();
                    $cookies.put(partial.data.id, 1, {
                        expires: new Date(currMs + 2592000000) // In 30 days
                    });
                    console.log("  COOOKIESSS ");
                    var cs = $cookies.getAll();
                    console.log(cs);
                    $scope.notify = function () {
                        console.log(partial.data.template);
                        var modal = $modal.open({
                            animation: true,
                            template: "<div class=modal-header>" + partial.data.template.header + "</div><div class='modal-body modal-body-center'>" + partial.data.template.body + "</div><div class=modal-footer><button class='btn btn-primary' type=button onclick='angular.element(this).scope().$dismiss(); angular.element(this).scope().showNotify=false'>OK</button></div>",
                            size: "m",
                            scope:$scope
   });

                    };
                }
            }, function (err) {
                console.log(err);
            });
    }])

    /**
     * Simple controller to expose the current page to the feedback button controller
     */
    .controller('FeedbackCtrl', ['$scope', '$location', '$log', 'cttvLocationState', function ($scope, $location, $log, cttvLocationState) {
        'use strict';
        // expose the location;
        // note that exposing the page as $location.absUrl() does not work as that would not update when URL changes
        $scope.location = $location;
        $scope.showSocialMedia = false;

        // perhaps we should use our locationstate service instead?
        $scope.$on('$locationChangeSuccess', function(){
            // when the location is back to the homepage, we hide the social media icons and show the "follow us" instead...
            if( $location.path()=='/' ){
                $scope.showSocialMedia = false;
            }
        });
    }]);
