angular.module('plugins')
    .directive('pdbTarget', ['$log', '$http', function ($log, $http) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: "plugins/pdb.html",
            scope: {
                target: '='
            },
            link: function (scope, element, attrs) {
                // TODO: This just takes a random PDB ID from the pdb section
                // A more rationale way should be implemented

                var uniprotId = scope.target.uniprot_id;

                $http.get("/proxy/www.ebi.ac.uk/pdbe/api/mappings/best_structures/" + uniprotId)
                    .then (function (resp) {
                        console.log(resp);
                        var bestStructure = resp.data[uniprotId][0];
                        console.log("BEST PROTEIN STRCTURE IS " + bestStructure.pdb_id);
                        scope.pdbId = bestStructure.pdb_id;
                    });


                // var pdb = scope.target.pdb;
                // scope.pdbId = _.sortBy(_.keys(pdb))[0].toLowerCase();
            }
        };
    }]);
