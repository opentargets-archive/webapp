angular.module('otControllers')

    /**
    * Controller to allow notifications to the user
    */
    .controller('NotifyController', ['$scope', '$log', '$http', '$uibModal', '$cookies', '$interval', 'otConfig', function ($scope, $log, $http, $uibModal, $cookies, $interval, otConfig) {
        'use strict';
        // Default behaviour on icon click
        $scope.notify = function () {};
        $scope.addCookie = function (cookieId) {
            var currMs = Date.now();
            $cookies.put(cookieId, 1, {
                expires: new Date(currMs + 2592000000) // In 30 days
            });
        };

        function polling () {
            // pull the latest notifications file: note the cache buster to ensure latest one is fetched
            $http.get('https://opentargets.github.io/live-files/notifications.json?v=' + otConfig.version)
                .then(function (partial) {
                    // We compare the expiry date with today
                    if (angular.isArray(partial.data)) { // There are notifications
                        var newNotifications = [];
                        for (var i = 0; i < partial.data.length; i++) {
                            var thisNotification = partial.data[i];
                            var thisCookie = $cookies.get(thisNotification.id);
                            // Check it has not expired
                            var t = moment(thisNotification.expiry).fromNow();
                            if (!thisCookie && (t.indexOf('ago') === -1) && (t.indexOf('in') === 0)) {
                                newNotifications.push(thisNotification);
                            }
                        }
                        $scope.notificationsLeft = newNotifications.length;

                        if (newNotifications.length) {
                            $scope.notify = function () {
                                // Start with the first notification
                                var notification = newNotifications.shift();
                                $scope.notificationsLeft = newNotifications.length;
                                $uibModal.open({
                                    animation: true,
                                    scope: $scope,
                                    template: '<div class=modal-header>' + notification.template.header + '</div>'
                                  + '<div class=\'modal-body modal-body-center\'>' + notification.template.body + '</div>'
                                  + '<div class=modal-footer>'
                                  + '    <button class=\'btn btn-primary\' type=button onclick=\'angular.element(this).scope().addCookie("' + notification.id + '");angular.element(this).scope().$dismiss();\'>OK</button>'
                                  + ' </div>'
                                  + '</div>',
                                    size: 'm'
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
    }]);
