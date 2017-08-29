angular.module('otDirectives')
    /**
     * Directive to parse Markdown documents
     */
    .directive('otMdParser', ['$log', '$http', '$sce', function ($log, $http, $sce) {
        'use strict';

        return {
            restrict: 'AE',
            scope: {
                url: '@'     // the url of the resource
            },
            template: '<div ng-bind-html="md"></div>',
            link: function (scope) {
                $http.get(scope.url)
                    .then(function successCallback (response) {
                    // this callback will be called asynchronously
                    // when the response is available
                        scope.md = $sce.trustAsHtml(marked(response.data));
                    }, function errorCallback (response) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                        $log.log(response);
                    });
            }
        };
    }]);
