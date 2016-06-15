angular.module('plugins')
    .directive('relatedDiseases', ['$log', 'cttvAPIservice', function ($log, cttvAPIservice) {
        "use strict";

        return {
            restrict: 'E',
            // templateUrl: 'plugins/related-diseases.html',
            scope: {
                disease: '=',
                width: '='
            },
            link: function (scope, element, attrs) {
                var newDiv = document.createElement("div");
                newDiv.id = "relatedDiseases";
                newDiv.className = "accordionCell";
                newDiv.style.width="1000px";
                newDiv.style.margin="0 auto";
                element[0].appendChild(newDiv);

                var v = vis()
                    .disease(scope.disease.efo)
                    .size(800)
                    .cttvApi(cttvAPIservice.getSelf());

                v(newDiv);
            }
        };
    }]);
