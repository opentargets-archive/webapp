/* Controllers */

angular.module('otControllers')
    .run(['$rootScope', '$window', '$uibModalStack', function ($rootScope, $window, $uibModalStack) {
        'use strict';

        // Close all the modal windows when the route changes
        $rootScope.$on('$routeChangeSuccess', function (newVal, oldVal) {
            if (oldVal !== newVal) {
                $uibModalStack.dismissAll();
            }

            $rootScope.showApiErrorMsg = false;
            $rootScope.showApiError500 = false;

            // Reset the datatables search;
            $.fn.dataTable.ext.search = [];
        });

        // Make sure the showApiErrorMsg flag is set to true when there
        // is an error when navigating (e.g. caused by a session timeout)
        $rootScope.$on('$routeChangeError', function () {
            $rootScope.showApiErrorMsg = true;
        });

        $rootScope.$on('cttvApiError', function (event, data) {
            if (data.status === 403) {
                $rootScope.showApiErrorMsg = true;
            }

            /*
            // Putting this here just as an example/placeholder for now
            $uibModal.open({
                animation: true,
                template: '<ot-modal header="API error" has-close="true">'
                                +'<p>A problem retrieving data has occurred. Please try to reload the page.<br />'
                                +'If the problem persists please contact our <a target=_blank href="mailto:support@targetvalidation.org?Subject=Open Targets Platform - help request">support team</a></p>'
                                +'<div><button class="btn btn-default btn-sm" ng-click="reloadPage()">Reload</button></div>'
                          +'</ot-modal>',
            });
            */
        });
        $rootScope.reloadPage = function () {
            $window.location.reload();
        };
    }]);

