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

                cttvAPIservice.getDiseaseRelation({
                    id: scope.disease.efo,
                })
                .then(
                    // success
                    function (resp) {
                        $log.log("getDiseaseRelation");
                        $log.log(resp);
                        scope.relations = resp.body.data;

                        var v = vis()
                            .disease(scope.disease.efo)
                            .size(800);

                        v(document.getElementById("relatedDiseases"));

                    },

                    // error handler
                    cttvAPIservice.defaultErrorHandler
                );

            }
        };
    }]);
