angular.module('plugins')
    .directive('pdbTarget', ['$log', '$http', '$compile', function ($log, $http, $compile) {
        'use strict';

        return {
            restrict: 'E',
            // templateUrl: "plugins/pdb.html",
            scope: {
                target: '='
            },
            link: function (scope, element, attrs) {

                var uniprotId = scope.target.uniprot_id;
                scope.pdbId = "4nfd";

                // <div style="margin: 30px;position:relative;width:500px;height:500px;">
                //     <pdb-topology-viewer entry-id="pdbId" entity-id="1"></pdb-topology-viewer>
                // </div>
                // <div style="margin: 30px;position:relative;width:500px;height:500px;">
                //     <pdb-lite-mol pdb-id="pdbId" hide-controls="true"></pdb-lite-mol>
                // </div>


                $http.get("/proxy/www.ebi.ac.uk/pdbe/api/mappings/best_structures/" + uniprotId)
                    .then (function (resp) {
                        var bestStructure = resp.data[uniprotId][0];
                        scope.pdbId = bestStructure.pdb_id;

                        var template = '<p>Showing the PDB structure for <a target=_blank href="http://www.ebi.ac.uk/pdbe/entry/pdb/' + bestStructure.pdb_id + '">' + bestStructure.pdb_id + '</a></p><tabset><tab heading=3D><div class="pdb-widget-container"><pdb-lite-mol pdb-id="pdbId" hide-controls=true></pdb-lite-mol></div></tab><tab heading=2D><div class="pdb-widget-container"><pdb-topology-viewer entry-id=' + bestStructure.pdb_id + ' entity-id=1></pdb-topology-viewer></div></tab><tabset>';
                        var compiled = $compile(template)(scope);
                        element.append(compiled);
                    });


                // var pdb = scope.target.pdb;
                // scope.pdbId = _.sortBy(_.keys(pdb))[0].toLowerCase();
            }
        };
    }]);
