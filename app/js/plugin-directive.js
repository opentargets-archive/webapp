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

                // Find the first ancestor element to get the width from
                var sectionWidth = 0;
                var e = element[0];
                while (true) {
                    var p = e.parentNode;
                    if (p.offsetWidth) {
                        sectionWidth = p.offsetWidth;
                        break;
                    }
                    if (e.parentNode) {
                        e = p;
                    } else {
                        break;
                    }
                }

                if (val === "true") {
                    loaded = true;
                    // Lazy load the dependencies
                    var deps = scope.dependencies;
                    var loadedDeps = [];
                    // TODO: This is loading all the deps async. No resources dependencies are considered at this time

                    for (var dep in deps) {
                        loadedDeps.push(lazy.import(dep));
                    }

                    // The component may not be able to display when the container is not visible, so we wait until it is
                    $q.all(loadedDeps)
                        .then (function () {
                            console.log("All deps have now been loaded...");
                            $timeout (function () {
                                var template = '<' + scope.plugin + (scope.target ? (" target=target") : " ") + (scope.disease ? ("disease=" + scope.disease) : "") + " width=" + sectionWidth + "></" + scope.plugin + ">";
                                var compiled = $compile(template)(scope);
                                element.append(compiled);
                            }, 0);
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
