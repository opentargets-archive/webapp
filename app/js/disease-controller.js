angular.module('cttvControllers')
/**
* DiseaseCtrl
* Controller for the disease page
* It loads general information about a given disease
*/
    .controller ('DiseaseCtrl', ["$scope", "$location", "$log", "cttvAPIservice", function ($scope, $location, $log, cttvAPIservice) {
        "use strict";
        $log.log("DiseaseCtrl()");
        var efo_code = $location.url().split("/")[2];
        cttvAPIservice.getDisease({
            code: efo_code
        })
        .then (function (resp) {
            var data = resp.body;

            var paths = [];
            for (var i=0; i<data.path.length; i++) {
                data.path[i].shift();
                var path=[];
                for(var j=0; j<data.path[i].length; j++){
                    path.push({
                        "label" : data.path[i][j].label,
                        "efo" : data.path[i][j].uri.split("/").pop()
                    });
                }
                paths.push(path);
            }

            if (data.efo_synonyms.length === 0) {
                data.efo_synonyms.push(resp.label);
            }
            $scope.disease = {
                "label" : data.label,
                "efo" : efo_code,
                "description" : data.definition || resp.label,
                "synonyms" : _.uniq(data.efo_synonyms),
                "paths" : paths,
                "children" : data.children
            };

            // Update bindings
            //$scope.$apply();
        });
    }]);
