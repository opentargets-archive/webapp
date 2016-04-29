angular.module('plugins', [])
.directive ('pluginLoader', ['$compile', '$timeout', function ($compile, $timeout) {

    return {
        restrict: 'E',
        scope: {
            'visible': '@',
            'plugin': '@',
            'target': '@',
            'disease': '@'
        },
        link: function(scope, element, attrs) {
            scope.$watch('visible', function (val) {
                if (val === "true") {
                    // The component may not be able to display when the container is not visible, so we wait until it is
                    $timeout (function () {
                        var template = '<' + scope.plugin + (scope.target ? (" target=" + scope.target) : " ") + (scope.disease ? ("disease=" + scope.disease) : "") + "></" + scope.plugin + ">";
                        var compiled = $compile(template)(scope);
                        element.append(compiled);
                    }, 100);
                } else {
                    while (element[0].firstChild) {
                        element[0].removeChild(element[0].firstChild);
                    }
                }
            });
        }
    };
}]);
