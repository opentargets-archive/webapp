angular.module('plugins')
    .directive('relatedTargets', ['$log', 'otApi', function ($log, otApi) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/related-targets.html',
            scope: {
                target: '='
            },
            link: function (scope, element, attrs) {
                otApi.getTargetRelation({
                    id: scope.target.id
                })
                    .then(
                    // success
                        function (resp) {
                        // $log.log("getTargetRelation");
                        // $log.log(resp);
                            scope.relations = resp.body.data.slice(1, 20);
                        },

                        // error handler
                        otApi.defaultErrorHandler
                    );
            }
        };
    }]);
