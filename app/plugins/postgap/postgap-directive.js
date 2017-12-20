angular.module('otPlugins')
    .directive('otPostgap', ['otApi', function (otApi) {
        return {
            restrict: 'E',
            templateUrl: 'plugins/postgap/postgap.html',
            scope: {
                target: '=',
                width: '='
            },
            link: function (scope, elem) {
                var ps = postgapViewer()
                    .gene(scope.target.id)
                    .cttvApi(otApi.getSelf());
                console.log(elem[0]);
                ps(elem[0]);
            }
        };
    }]);
