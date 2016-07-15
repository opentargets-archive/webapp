angular.module('plugins')
    .directive('pdbTarget', ['$log', '$http', '$compile', '$timeout', function ($log, $http, $compile, $timeout) {
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

                $http.get("/proxy/www.ebi.ac.uk/pdbe/api/mappings/best_structures/" + uniprotId)
                    .then (function (resp) {
                        var bestStructure = resp.data[uniprotId][0];
                        scope.pdbId = bestStructure.pdb_id;

                        var template = '<p>Showing the PDB structure for <a class=pdb-links pdb-id=' + bestStructure.pdb_id + ' target=_blank href="javascript:void(0);">' + bestStructure.pdb_id + '</a></p><tabset><tab heading=3D><div class="pdb-widget-container"><pdb-lite-mol pdb-id="pdbId" hide-controls=true></pdb-lite-mol></div></tab><tab heading=2D><div class="pdb-widget-container"><pdb-topology-viewer entry-id=' + bestStructure.pdb_id + ' entity-id=1></pdb-topology-viewer></div></tab><tab heading=PV><div id=pvTarget></div></tab><tabset>';
                        var compiled = $compile(template)(scope);
                        element.append(compiled);


                        // PV viewer
                        $timeout(function () {
                            var pvContainer = document.getElementById("pvTarget");
                            // override the default options with something less restrictive.
                            var options = {
                              width: 600,
                              height: 600,
                              antialias: true,
                              quality : 'medium'
                            };
                            // insert the viewer under the Dom element with id 'gl'.
                            var viewer = pv.Viewer(pvContainer, options);
                            $http.get('http://pdb.org/pdb/files/'+bestStructure.pdb_id+'.pdb')
                                .then (function (data) {
                                    var structure = pv.io.pdb(data.data);
                                    viewer.cartoon('protein', structure);
                                    viewer.autoZoom();

                                    viewer.on('viewerReady', function() {
                                        // structure.atomSelect(function (a) {
                                        //     console.log(a);
                                        // });
                                    });
                                });
                        },0);
                    });


                // var pdb = scope.target.pdb;
                // scope.pdbId = _.sortBy(_.keys(pdb))[0].toLowerCase();
            }
        };
    }]);
