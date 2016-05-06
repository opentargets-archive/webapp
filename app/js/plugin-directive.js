angular.module('plugins', [])
.directive ('pluginLoader', ['$compile', '$timeout', 'lazy', '$q', function ($compile, $timeout, lazy, $q) {
    return {
        restrict: 'E',
        scope: {
            'visible': '@',
            'plugin': '=',
            'target': '=',
            'disease': '=',
            'dependencies': '='
        },
        link: function(scope, element, attrs) {
            scope.$watch('visible', function (val) {
                if (val === "true") {
                    // Lazy load the dependencies
                    var deps = scope.dependencies;
                    console.log(deps);
                    var loadedDeps = [];
                    // TODO: This is loading all the deps async. No resources dependencies are considered at this time
                    for (var i=0; i<deps.length; i++) {
                        loadedDeps.push(lazy.loadScript(deps[i]));
                    }

                    // The component may not be able to display when the container is not visible, so we wait until it is
                    $q.all(loadedDeps)
                    .then (function () {
                        console.log(myTest(scope.target.symbol));
                        $timeout (function () {
                            console.log(scope.target);
                            var template = '<' + scope.plugin + (scope.target ? (" target=target") : " ") + (scope.disease ? ("disease=" + scope.disease) : "") + "></" + scope.plugin + ">";
                            var compiled = $compile(template)(scope);
                            element.append(compiled);
                        }, 100);
                    });
                } else {
                    while (element[0].firstChild) {
                        element[0].removeChild(element[0].firstChild);
                    }
                }
            });
        }
    };
}]);
