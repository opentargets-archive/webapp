angular.module('plugins')
    .directive('pdbTarget', ['$log', '$http', '$compile', 'cttvUtils', '$timeout', function ($log, $http, $compile, cttvUtils, $timeout) {
        'use strict';

        return {
            restrict: 'E',
            template: '<p>Structure for {{pdbId}}</p><png filename="{{target.approved_symbol}}-structure.png" track="targetStructure"></png>',
            // templateUrl: "plugins/pdb.html",
            scope: {
                target: '=',
                width: '='
            },
            link: function (scope, element, attrs) {

                var uniprotId = scope.target.uniprot_id;

                var w = scope.width - 40;
                var newDiv = document.createElement("div");
                newDiv.id = "pvTarget";
                newDiv.className = "accordionCell";
                element[0].appendChild(newDiv);


                $http.get("/proxy/www.ebi.ac.uk/pdbe/api/mappings/best_structures/" + uniprotId)
                    .then (function (resp) {
                        var bestStructure = resp.data[uniprotId][0];
                        scope.pdbId = bestStructure.pdb_id;

                        // PV viewer
                        $timeout(function () {
                            var parent = newDiv;
                            // override the default options with something less restrictive.
                            var options = {
                                width: scope.width - 30,
                                height: 600,
                                antialias: true,
                                quality : 'medium'
                            };

                            function setColorForAtom(go, atom, color) {
                                var view = go.structure().createEmptyView();
                                view.addAtom(atom);
                                go.colorBy(pv.color.uniform(color), view);
                            }

                            var viewer = pv.Viewer(parent, options);
                            $http.get('/proxy/files.rcsb.org/view/' + bestStructure.pdb_id + '.pdb')
                            // $http.get('/proxy/pdb.org/pdb/files/'+bestStructure.pdb_id+'.pdb')
                                .then (function (data) {
                                    // variable to store the previously picked atom. Required for resetting the color
                                    // whenever the mouse moves.
                                    var prevPicked = null;
                                    // add mouse move event listener to the div element containing the viewer. Whenever
                                    // the mouse moves, use viewer.pick() to get the current atom under the cursor.
                                    parent.addEventListener('mousemove', function(event) {
                                        var rect = viewer.boundingClientRect();
                                        var picked = viewer.pick({ x : event.clientX - rect.left,
                                            y : event.clientY - rect.top
                                        });
                                        if (prevPicked !== null && picked !== null && picked.target() === prevPicked.atom) {
                                            return;
                                        }
                                        if (prevPicked !== null) {
                                          // reset color of previously picked atom.
                                          setColorForAtom(prevPicked.node, prevPicked.atom, prevPicked.color);
                                        }
                                        if (picked !== null) {
                                          var atom = picked.target();
                                          document.getElementById('picked-atom-name').innerHTML = atom.qualifiedName();
                                          // get RGBA color and store in the color array, so we know what it was
                                          // before changing it to the highlight color.
                                          var color = [0,0,0,0];
                                          var currColor = picked.node().getColorForAtom(atom, color);
                                          console.log(currColor);
                                          prevPicked = { atom : atom, color : color, node : picked.node() };

                                          if (currColor[0] === 1) {
                                              console.log("setting atom to blue");
                                              setColorForAtom(picked.node(), atom, 'blue');
                                          } else {
                                              setColorForAtom(picked.node(), atom, 'red');
                                          }

                                        } else {
                                          document.getElementById('picked-atom-name').innerHTML = '&nbsp;';
                                          prevPicked = null;
                                        }
                                        viewer.requestRedraw();
                                    });


                                    var structure = pv.io.pdb(data.data);
                                    viewer.cartoon('protein', structure, {
                                        color: pv.color.byChain()
                                    });
                                    viewer.autoZoom();

                                    // viewer.on('viewerReady', function() {
                                        // structure.atomSelect(function (a) {
                                        //     console.log(a);
                                        // });
                                    // });
                                });
                                scope.toExport = function () {
                                    var canvas = newDiv.getElementsByTagName("canvas");
                                    return canvas[0];
                                };

                        },0);
                    }, function (resp) { // error
                        var template = "<div>No structure found for {{target.approved_symbol}}</div>";
                        var compiled = $compile(template)(scope);
                        element.append(compiled);
                    });

                if (cttvUtils.browser.name !== "IE") {
                    scope.toExport = function () {
                        console.log("element...");
                        console.log(element[0]);
                        var canvas = element[0].querySelector("div#pvTarget > canvas");
                        console.log(canvas);
                        return canvas;
                    };
                }

                // var pdb = scope.target.pdb;
                // scope.pdbId = _.sortBy(_.keys(pdb))[0].toLowerCase();
            }
        };
    }]);
