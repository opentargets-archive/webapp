angular.module('plugins', [])
    .directive('pluginLoader', ['$log', '$compile', '$timeout', 'lazy', '$q', '$analytics', function ($log, $compile, $timeout, lazy, $q, $analytics) {

        return {
            restrict: 'E',
            scope: {
                'visible': '@',
                'plugin': '=',
                'target': '=',
                'disease': '=',
                'associations': '=',
                'dependencies': '=',
                'page': '=',
                'track': '=',
                'label': '='
            },
            link: function (scope, element, attrs) {
                scope.alreadyLoaded = {};

                scope.$watch('visible', function () {

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

                    if (scope.visible === "true") {
                        if (scope.alreadyLoaded[scope.plugin]) {
                            return;
                        } else {
                            scope.alreadyLoaded[scope.plugin] = true;
                        }

                        if (scope.track) {
                            $analytics.eventTrack('profile', {"category": attrs.page, "label": scope.label});
                        }

                        // spinner
                        // TODO: substitute by spinner directive
                        var spinnerDiv = document.createElement("div");
                        // TODO: put this back when D3 upgrade is done
                        var sp = spinner()
                            .size(30)
                            .stroke(3);
                        sp(spinnerDiv);
                        element[0].appendChild(spinnerDiv);

                        // Lazy load the dependencies
                        var deps = scope.dependencies;
                        var loadedDeps = [];
                        for (var dep in deps) {
                            loadedDeps.push(lazy.import(dep));
                        }

                        // The component may not be able to display when the container is not visible, so we wait until it is
                        $q.all(loadedDeps)
                            .then(function () {
                                // remove the spinner
                                element[0].removeChild(spinnerDiv);
                                // var spinner = document.getElementById("section-spinner-" + scope.label);
                                // spinner.parentNode.removeChild(spinner);
                                $timeout(function () {
                                    // var template = '<' + scope.plugin + " associations=" + (scope.associations ? ("associations") : '""') + " target=" + (scope.target ? ("target") : '""') + " disease=" + (scope.disease ? ("disease") : '""') + " width=" + sectionWidth + "></" + scope.plugin + ">";
                                    var template = "<" + scope.plugin + " associations=associations target=target disease=disease width=" + sectionWidth + "></" + scope.plugin + ">";
                                    var compiled = $compile(template)(scope);
                                    element.append(compiled);
                                }, 0);

                            });
                    } else {
                        // while (element[0].firstChild) {
                        //     element[0].removeChild(element[0].firstChild);
                        // }
                    }
                })
            }
        };
    }]);
