/* Add to the cttv controllers module */
angular.module('cttvControllers')

.controller ("SummaryCtrl", ['$scope', '$location', '$log', function ($scope, $location, $log) {
    'use strict';

    // Parse the $location search object to determine which entities we have.
    var search = $location.search();

    // Recognised entities:
    // targets / target
    if (search.target) {
        if (angular.isArray(search.target)) {
            $scope.targets = search.target;
        } else {
            $scope.target = search.target;
        }
    }

    // diseases / disease
    if (search.disease) {
        if (angular.isArray(search.disease)) {
            $scope.diseases = search.disease;
        } else {
            $scope.disease = search.disease;
        }
    }

    // pathway
    if (search.pathway) {
        $scope.pathway = search.pathway;
        if (search["pathway-target"]) {
            if (!angular.isArray(search["pathway-target"])) {
                $scope.pathwayTargets = [search["pathway-target"]];
            } else {
                $scope.pathwayTargets = search["pathway-target"];
            }
        }
    }

    // drugs / drug
    if (search.drug) {
        if (angular.isArray(search.drug)) {
            $scope.drugs = search.drug;
        } else {
            $scope.drug = search.drug;
        }
    }

    // TODO: Other combinations?
    // TODO: What about target lists or any other list?
    // For now we can treat a target list as a list of targets and we deal with that in the search page
}]);
