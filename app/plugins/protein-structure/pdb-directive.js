angular.module('otPlugins')
    .directive('otPdbTarget', ['$http', 'otUtils', '$timeout', function ($http, otUtils, $timeout) {
        'use strict';

        return {
            restrict: 'E',
            template: '' +
            '<div ng-show="noPdb">No structure found for {{target.approved_symbol}}</div>' +
            '<div ng-show="pdbId">' +
            '     <p class=ot-section-intro>Below is shown the best structure found in PDBe for {{target.approved_symbol}}. It corresponds to PDBe entry {{pdbId}} based on coverage and structure quality. To get more information about this structure visit the <a target=_blank href="http://www.ebi.ac.uk/pdbe/entry/pdb/{{pdbId}}">PDBe entry for {{pdbId}}</a></p>' +
            '     <p>Structure for <b>{{pdbId}}</b> ({{title | lowercase}})</p>' +
            '     <ot-png style="float:right" filename="{{target.approved_symbol}}-structure.png" track="targetStructure"></ot-png>' +
            '     <div style="position:relative">' +
            '          <div id=picked-atom-name style="text-align:center;"">&nbsp;</div>' +
            '          <div id="pdb-hamburger-menu"></div>' +
            '     </div>' +
            '</div>',
            // templateUrl: "plugins/protein-structure/pdb.html",
            scope: {
                target: '=',
                width: '='
            },
            link: function (scope, element) {
                var uniprotId = scope.target.uniprot_id;

                // burger menu
                $timeout(function () {
                    var burgerContainer = d3.select(document.getElementById('pdb-hamburger-menu'));
                    burgerContainer
                        .append('div')
                        .style('position', 'relative');
                    burgerContainer
                        .append('div')
                        .attr('class', 'hamburger-frame')
                        .on('click', function () {
                            if (div.style('height') === '0px') {
                                div
                                    .transition()
                                    .duration(1000)
                                    .style('height', '130px');
                            } else {
                                div
                                    .transition()
                                    .duration(1000)
                                    .style('height', '0px');
                            }
                        });

                    var div = burgerContainer
                        .append('div')
                        .attr('class', 'cttv_targetTree_legend');

                    var colorSection = div
                        .append('div');
                    colorSection
                        .append('h4')
                        .text('Color by...');
                    colorSection
                        .append('input')
                        .style('margin', '10px')
                        .attr('type', 'radio')
                        .attr('name', 'colorBy')
                        .attr('value', 'chain')
                        .property('checked', true)
                        .on('change', function () {
                            scope.viewer.clear();
                            scope.viewer.cartoon('protein', scope.structure, {
                                color: pv.color.byChain()
                            });
                        });
                    colorSection
                        .append('text')
                        .text(' Chain');
                    colorSection.append('br');
                    colorSection
                        .append('input')
                        .style('margin', '10px')
                        .style('margin-top', '0px')
                        .attr('type', 'radio')
                        .attr('name', 'colorBy')
                        .attr('value', 'Structure')
                        .on('change', function () {
                            scope.viewer.clear();
                            scope.viewer.cartoon('protein', scope.structure, {
                                color: pv.color.ssSuccession()
                            });
                        });
                    colorSection
                        .append('text')
                        .text(' Structure');

                    burgerContainer
                        .append('div')
                        .attr('class', 'hamburger-menu');
                }, 0);

                // PV
                var w = scope.width - 120;
                var newDiv = document.createElement('div');
                newDiv.id = 'pvTarget';
                newDiv.className = 'accordionCell';
                element[0].appendChild(newDiv);


                $http.get('/proxy/www.ebi.ac.uk/pdbe/api/mappings/best_structures/' + uniprotId)
                    .then(function (resp) {
                        var bestStructure = resp.data[uniprotId][0];
                        scope.pdbId = bestStructure.pdb_id;

                        // PV viewer
                        $timeout(function () {
                            var parent = newDiv;
                            // override the default options with something less restrictive.
                            var options = {
                                width: w,
                                height: 600,
                                antialias: true,
                                quality: 'medium'
                            };

                            function setColorForAtom (go, atom, color) {
                                var view = go.structure().createEmptyView();
                                view.addAtom(atom);
                                go.colorBy(pv.color.uniform(color), view);
                            }

                            scope.viewer = pv.Viewer(parent, options);
                            $http.get('/proxy/files.rcsb.org/view/' + bestStructure.pdb_id + '.pdb')
                            // $http.get('https://files.rcsb.org/view/' + bestStructure.pdb_id + ".pdb")
                            // $http.get('/proxy/pdb.org/pdb/files/'+bestStructure.pdb_id+'.pdb')
                                .then(function (data) {
                                    // Extract the title:
                                    var lines = data.data.split('\n');
                                    for (var i = 0; i < lines.length; i++) {
                                        if (lines[i].startsWith('TITLE')) {
                                            var titleCols = lines[i].split(/\s+/);
                                            titleCols.shift();
                                            scope.title = titleCols.join(' ').trim();
                                        }
                                    }


                                    // variable to store the previously picked atom. Required for resetting the color
                                    // whenever the mouse moves.
                                    var prevPicked = null;
                                    // add mouse move event listener to the div element containing the viewer. Whenever
                                    // the mouse moves, use viewer.pick() to get the current atom under the cursor.
                                    parent.addEventListener('mousemove', function (event) {
                                        var rect = scope.viewer.boundingClientRect();
                                        var picked = scope.viewer.pick({x: event.clientX - rect.left,
                                            y: event.clientY - rect.top
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
                                            var color = [0, 0, 0, 0];
                                            var currColor = picked.node().getColorForAtom(atom, color);
                                            prevPicked = {atom: atom, color: color, node: picked.node()};

                                            if (currColor[0] === 1) {
                                                setColorForAtom(picked.node(), atom, 'blue');
                                            } else {
                                                setColorForAtom(picked.node(), atom, 'red');
                                            }
                                        } else {
                                            document.getElementById('picked-atom-name').innerHTML = '&nbsp;';
                                            prevPicked = null;
                                        }
                                        scope.viewer.requestRedraw();
                                    });


                                    scope.structure = pv.io.pdb(data.data);
                                    scope.viewer.cartoon('protein', scope.structure, {
                                        color: pv.color.byChain()
                                    });
                                    scope.viewer.autoZoom();

                                    // viewer.on('viewerReady', function() {
                                    // structure.atomSelect(function (a) {
                                    //     $log.log(a);
                                    // });
                                    // });
                                });
                            scope.toExport = function () {
                                var canvas = newDiv.getElementsByTagName('canvas');
                                return canvas[0];
                            };
                        }, 0);
                    }, function () { // error
                        scope.noPdb = true;
                        // var template = "<div>No structure found for {{target.approved_symbol}}</div>";
                        // var compiled = $compile(template)(scope);
                        // element.append(compiled);
                    });

                if (otUtils.browser.name !== 'IE') {
                    scope.toExport = function () {
                        var canvas = element[0].querySelector('div#pvTarget > canvas');
                        return canvas;
                    };
                }

                // var pdb = scope.target.pdb;
                // scope.pdbId = _.sortBy(_.keys(pdb))[0].toLowerCase();
            }
        };
    }]);
