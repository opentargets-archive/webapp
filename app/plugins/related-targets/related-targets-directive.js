angular.module('otPlugins')
    .directive('otRelatedTargets', ['otApi', function (otApi) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/related-targets/related-targets.html',
            scope: {
                target: '='
            },
            link: function (scope, element, attrs) {
                var id = scope.target.id;
                var opts = {
                    id: id
                };
                var queryObject = {
                    method: 'GET',
                    params: opts
                };
                otApi.getTargetRelation(queryObject)
                    .then(
                        // success
                        function (resp) {
                            console.log(resp.body.data);
                            scope.relations = resp.body.data.slice(1, 20);
                        },

                        // error handler
                        otApi.defaultErrorHandler
                    );
            }
        };
    }]);
