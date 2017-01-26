  /* Controllers */

    angular.module('cttvControllers', [])
    .run (['$rootScope', '$window', '$uibModalStack', function ($rootScope, $window, $uibModalStack) {
        'use strict';

        // Close all the modal windows when the route changes
        $rootScope.$on('$routeChangeSuccess', function (newVal, oldVal) {
            if (oldVal !== newVal) {
                $uibModalStack.dismissAll();
            }

            $rootScope.showApiErrorMsg = false;
            $rootScope.showApiError500 = false;
        });

        $rootScope.$on("cttvApiError", function (event, data) {
            if (data.status === 403) {
                $rootScope.showApiErrorMsg = true;
            }

            /*
            // Putting this here just as an example/placeholder for now
            $uibModal.open({
                animation: true,
                template: '<cttv-modal header="API error" has-close="true">'
                                +'<p>A problem retrieving data has occurred. Please try to reload the page.<br />'
                                +'If the problem persists please contact our <a target=_blank href="mailto:support@targetvalidation.org?Subject=Open Targets Platform - help request">support team</a></p>'
                                +'<div><button class="btn btn-default btn-sm" ng-click="reloadPage()">Reload</button></div>'
                          +'</cttv-modal>',
            });
            */
        });
        $rootScope.reloadPage = function () {
            $window.location.reload();
        };
    }])



    /**
     * Controller for the masthead navigations
     * Simply exposes the location service
     */
    .controller('MastheadCtrl', ['$scope', '$location', '$log', 'cttvLocationState', function ($scope, $location, $log, cttvLocationState) {
        'use strict';

        $scope.location = $location;

        // options must be exposed as an object, or else Angular doesn't update the view
        $scope.opts = {
            showResponsiveSearch : false
        }

        $scope.$on('$locationChangeSuccess', function(){
            // when we change page, close the search in case it's visible
            $scope.opts.showResponsiveSearch = false;
        });

    }])



    /**
    * Controller to allow notifications to the user
    */
    .controller('NotifyCtrl', ['$scope', '$log', '$http', '$uibModal', '$cookies', '$interval', function ($scope, $log, $http, $uibModal, $cookies, $interval) {
        'use strict';
        // $log.log(" NotifyCtrl ");
        // Default behaviour on icon click
        $scope.notify = function(){};
        $scope.addCookie = function (cookieId) {
            var currMs = Date.now();
            $cookies.put(cookieId, 1, {
                expires: new Date(currMs + 2592000000) // In 30 days
            });
        };

        function polling () {
            // $http.get("/notifications.json")
            $http.get('https://opentargets.github.io/live-files/notifications.json')
                .then (function(partial) {
                    // We compare the expiry date with today
                    if (angular.isArray(partial.data)) { // There are notifications
                        var newNotifications = [];
                        for (var i=0; i<partial.data.length; i++) {
                            var thisNotification = partial.data[i];
                            var thisCookie = $cookies.get(thisNotification.id);
                            // Check it has not expired
                            var t = moment(thisNotification.expiry).fromNow();
                            if (!thisCookie && (t.indexOf('ago')===-1) && (t.indexOf('in') === 0)) {
                                newNotifications.push(thisNotification);
                            }
                        }
                        $scope.notificationsLeft = newNotifications.length;

                        if (newNotifications.length) {
                            $scope.notify = function () {
                                // Start with the first notification
                                var notification = newNotifications.shift();
                                $scope.notificationsLeft = newNotifications.length;
                                var modal = $uibModal.open({
                                    animation: true,
                                    scope: $scope,
                                    template: "<div class=modal-header>" + notification.template.header + "</div>"
                                    + "<div class='modal-body modal-body-center'>" + notification.template.body + "</div>"
                                    + "<div class=modal-footer>"
                                    + "    <button class='btn btn-primary' type=button onclick='angular.element(this).scope().addCookie(\"" + notification.id + "\");angular.element(this).scope().$dismiss();'>OK</button>"
                                    + " </div>"
                                    + "</div>",
                                    size: "m"
                                });
                            };
                        }
                    }
                }, function (err) {
                    $log.warn(err);
                });
        }
        polling();
        $interval(polling, 600000);
    }])



    /**
      * Controller for the target list results page
    **/
    .controller('BatchSearchCtrl', ['$log', '$scope', function ($log, $scope) {
        'use strict';
        $scope.list = null;
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
    }])



    /**
     * Simple controller to expose the current page to the feedback button controller
     */
    .controller('StatsCtrl', ['$scope', 'cttvAPIservice', '$log', function ($scope, cttvAPIservice, $log) { 
        'use strict';
        // expose the location;
        // note that exposing the page as $location.absUrl() does not work as that would not update when URL changes
        $scope.stats = {};

        cttvAPIservice.getStats()
            .then(
                function(resp) {

                    // copy/expose repsonse to scope
                    _.forOwn(resp.body, function(value, key) {
                        $scope.stats[key] = value;
                    });

                    // count the datasources
                    var dbsctn = 0;

                    _.forOwn(resp.body.associations.datatypes, function(value, key) {
                        _.forOwn(value.datasources, function(v,k){
                            dbsctn++;
                        });

                    });

                    $scope.stats.datasources = {
                        total: dbsctn
                    }

                    // how about release date?
                    var d = resp.body.data_version.split(".");
                    d[0] = "20"+d[0];   // format as "20xx"
                    d[1] = parseInt(d[1])-1; // month starts at 0
                    $scope.stats.date = new Date(d[0], d[1]); // expose as a Date object
                },
                cttvAPIservice.defaultErrorHandler
            )
            // .finally(function(){
            //     $scope.search.loading = false;
            // });

    }]);



