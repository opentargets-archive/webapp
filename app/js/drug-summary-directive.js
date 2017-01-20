angular.module('cttvDirectives')
.directive('myDrugSummary', ['$log', '$http', function ($log, $http) {
    'use strict';

    function pngToDataUrl(url, callback, outputFormat) {
        var img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function () {
            var canvas = document.createElement('CANVAS');
            var ctx = canvas.getContext('2d');
            var dataURL;
            canvas.height = this.height;
            canvas.width = this.width;
            ctx.drawImage(this, 0, 0);
            dataURL = canvas.toDataURL(outputFormat);
            callback(dataURL);
            canvas = null;
        };
        img.src = url;
    }

    return {
        restrict: 'E',
        templateUrl: 'partials/drug-summary.html',
        scope: {
            drug: "="
        },
        link: function (scope, el, attrs) {
            scope.$watch ('drug', function () {
                if (!scope.drug) {
                    return;
                }

                pngToDataUrl('https://www.ebi.ac.uk/chembl/api/data/image/' + scope.drug, function (base64Img) {
                    var img = document.getElementById('drugDiagramContainer');
                    img.setAttribute('src', base64Img);
                });

                // Get the information for the drug...
                $http.get('https://www.ebi.ac.uk/chembl/api/data/molecule/' + scope.drug)
                    .then (function (resp) {
                        $log.log(resp);
                        scope.displayName = resp.data.pref_name || resp.data.molecule_chembl_id;
                        scope.mechanism = resp.data.usan_stem_definition || 'NA';
                        scope.mol_type = resp.data.molecule_type || 'NA';
                        scope.first_approval = resp.data.first_approval || 'NA';
                        scope.max_phase = resp.data.max_phase || 'NA';
                        scope.formula = resp.data.molecule_properties.full_molformula || 'NA';
                    });

            })
        }
    };
}]);