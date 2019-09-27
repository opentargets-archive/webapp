/* Controllers */

angular.module('otControllers')
    .run(['$rootScope', '$window', '$uibModalStack', '$location', 'otConfig', function ($rootScope, $window, $uibModalStack, $location, otConfig) {
        'use strict';

        function updateCanonicalUrl () {
            // configure canonical_url based on config file:
            // use specified url or default to current one; if null set to empty string
            $rootScope.canonical_url = (otConfig.canonical_url_base === null) ? '' : (otConfig.canonical_url_base || $location.host()) + $location.path();
        }


        // Close all the modal windows when the route changes
        $rootScope.$on('$routeChangeSuccess', function (newVal, oldVal) {
            if (oldVal !== newVal) {
                $uibModalStack.dismissAll();
            }

            $rootScope.showApiErrorMsg = false;
            $rootScope.showApiError500 = false;

            // Reset the datatables search;
            $.fn.dataTable.ext.search = [];

            // Set canonical view stuff
            updateCanonicalUrl();
        });

        $rootScope.$on('$routeUpdate', function (newVal, oldVal) {
            updateCanonicalUrl();
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

