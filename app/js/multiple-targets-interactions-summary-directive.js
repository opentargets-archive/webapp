angular.module('cttvDirectives')

.directive ('multipleTargetsInteractionsSummary', ['$log', 'cttvAPIservice', '$http', '$q', '$timeout', function ($log, cttvAPIservice, $http, $q, $timeout) {
    'use strict';

    return {
        restrict: 'E',
        templateUrl: 'partials/multiple-targets-interactions-summary.html',
        scope: {
            target: '=',
            width: '='
        },
        link: function (scope, element, attrs) {
            var ivTooltip; // the tooltip for the interaction viewer.

            scope.$watchGroup(['target', 'associations'], function () {
                if (!scope.target) {
                    return;
                }

                scope.showSpinner=true;

                var mapNames = {};
                var uniprotIds = [];
                var interactors = {};
                scope.target.map(function (d) {
                    mapNames[d.uniprot_id] = d.approved_symbol;
                    interactors[d.approved_symbol] = {
                        label: d.approved_symbol,
                        uniprot_id: d.uniprot_id,
                        // interactsWithObj: {},
                        interactsWith: {}
                    };
                    if (d.uniprot_id) {
                        uniprotIds.push(d.uniprot_id);
                    }
                });

                // Save a pathway Id => pathway label map to refer to pathway maps later
                var ids2names = {};

                // Get Pathways data from Reactome
                // Get enrichment analysis from reactome
                // http://www.reactome.org/AnalysisService/identifiers/projection/\?pageSize\=1\&page\=1 POST
                var preFlightUrl = '/proxy/www.reactome.org/AnalysisService/identifiers/projection?pageSize=1&page=1&resource=UNIPROT';
                var postData = uniprotIds.join('\n');
                // var p1 = $q(function(resolve, reject) {
                //     resolve({data: []});
                // });
                var p1 = $http.post(preFlightUrl, postData)
                    .then (function (resp) {
                        return resp.data;
                    })
                    .then (function (data) {
                        var token = data.summary.token;
                        var nPathways = data.pathwaysFound;
                        var url = '/proxy/www.reactome.org/AnalysisService/token/' + token + '?pageSize=' + nPathways + '&page=1&resource=UNIPROT';
                        return $http.get(url)
                            .then (function (resp) {
                                var token = resp.data.summary.token;
                                var url2 = '/proxy/www.reactome.org/AnalysisService/token/' + token + '/found/all';

                                var idsArr = [];
                                for (var i=0; i<resp.data.pathways.length; i++) {
                                    var o = resp.data.pathways[i];
                                    ids2names[o.stId] = o.name;
                                    idsArr.push(o.stId);
                                }
                                var postData2 = idsArr.join(',');
                                return $http.post(url2, postData2)
                                    .then (function (targetPathways) {
                                        return targetPathways;
                                    });
                            });
                    });

                // Get the IntAct data from omnipathdb...
                var url = "/proxy/www.omnipathdb.org/interactions/" + uniprotIds.join(',') + '?format=json&fields=sources';
                var p2 = $http.get(url)
                    .then(function (resp) {
                        return resp;
                    });

                // Sources filter (store the source and the number of interactions it supports)
                var sources = {};

                $q.all([p1, p2])
                    .then(function (resps) {

                        // Parse the pathways (reactome) data
                        var targetPathways = resps[0];
                        var targets4pathways = {};
                        for (var k = 0; k < targetPathways.data.length; k++) {
                            var pId = targetPathways.data[k].pathway;
                            targets4pathways[pId] = targetPathways.data[k].entities;
                        }

                        for (var pName in targets4pathways) {
                            if (!targets4pathways.hasOwnProperty(pName)) {
                                continue;
                            }
                            var p = targets4pathways[pName];
                            if (p.length < 2) {
                                continue;
                            }
                            for (var i = 0; i < p.length; i++) {
                                var i1 = mapNames[p[i].id];
                                for (var j = 1; j < p.length; j++) {
                                    var i2 = mapNames[p[j].id];
                                    if (i1 === i2) {
                                        continue;
                                    }

                                    if (!interactors[i1]) {
                                        interactors[i1] = {
                                            label: i1,
                                            interactsWith: {}
                                        }
                                    }
                                    if (!interactors[i2]) {
                                        interactors[i2] = {
                                            label: i2,
                                            interactsWith: {}
                                        }
                                    }
                                    if (!interactors[i1].interactsWith[i2]) {
                                        interactors[i1].interactsWith[i2] = {
                                            label: i2,
                                            provenance: []
                                        }
                                    }
                                    if (!interactors[i2].interactsWith[i1]) {
                                        interactors[i2].interactsWith[i1] = {
                                            label: i1,
                                            provenance: []
                                        }
                                    }
                                    // Record in sources filter
                                    if (!sources.Reactome) {
                                        sources.Reactome = 0;
                                    }
                                    sources.Reactome++;


                                    interactors[i1].interactsWith[i2].provenance.push({
                                        id: pName,
                                        label: ids2names[pName],
                                        source: 'Reactome'
                                    });
                                    // interactors[i2].interactsWith[i1].provenance.push({
                                    //     id: pName,
                                    //     label: ids2names[pName],
                                    //     label: ids2names[pName]
                                    // })
                                }
                            }
                        }

                        // Parse the IntAct (omnipathdb) data
                        var odbData = resps[1].data;
                        for (var i = 0; i < odbData.length; i++) {
                            var link = odbData[i];
                            var source = mapNames[link.source];
                            var target = mapNames[link.target];
                            var provenance = link.sources;

                            if ((source && target) && (source !== target)) {
                                if (!interactors[source]) {
                                    interactors[source] = {
                                        label: source,
                                        interactsWith: {}
                                    }
                                }
                                if (!interactors[target]) {
                                    interactors[target] = {
                                        label: target,
                                        interactsWith: {}
                                    }
                                }
                                if (!interactors[source].interactsWith[target]) {
                                    interactors[source].interactsWith[target] = {
                                        label: target,
                                        provenance: []
                                    }
                                }
                                if (!interactors[target].interactsWith[source]) {
                                    interactors[target].interactsWith[source] = {
                                        label: source,
                                        provenance: []
                                    }
                                }
                                // interactors[source].interactsWith[target].provenance.push({
                                //     id: "IntAct",
                                //     label: "PPI",
                                //     source: 'IntAct'
                                // });
                                for (var f=0; f<provenance.length; f++) {
                                    var prov = provenance[f];
                                    if (!sources[prov]) {
                                        sources[prov] = 0;
                                    }
                                    sources[prov]++;
                                    interactors[source].interactsWith[target].provenance.push({
                                        id: prov,
                                        label: prov,
                                        source: "OmnipathDB"
                                    })
                                }
                                // interactors[source].interactsWith[target].provenance = provenance;
                            }
                        }

                        // Set up the interactors viewer
                        var interactorsArr = [];
                        for (var inter in interactors) {
                            if (interactors.hasOwnProperty(inter)) {
                                interactorsArr.push(interactors[inter]);
                            }
                        }
                        // var interactorsArr = Object.values(interactors);
                        $log.log("Final interactors...");
                        $log.log(interactorsArr);

                        scope.sources = sources;

                        // Tooltips
                        var hover_tooltip;

                        function mouseoverTooltip(d) {
                            var obj = {};
                            obj.header = "";
                            obj.body = d.label + " (" + Object.keys(d.interactsWith).length + " interactors)";
                            hover_tooltip = tooltip.plain()
                                .width(180)
                                .show_closer(false)
                                .id(2)
                                .call(this, obj);
                        }

                        // Keep track of the filtering
                        scope.filterOut = {};
                        scope.filterSource = function (source) {
                            $log.log("filter source " + source);
                            if (scope.filterOut[source]) {
                                delete(scope.filterOut[source]);
                            } else {
                                scope.filterOut[source] = true;
                            }
                            $log.log(scope.filterOut);
                            iv.filters(scope.filterOut);
                            iv.update();
                        };

                        scope.selectedNodes = [];
                        scope.unselectNode = function (node) {
                            $log.log('simulating a click in ');
                            $log.log(node);
                            iv.click(node);
                            for (var i = 0; i < scope.selectedNodes.length; i++) {
                                if (scope.selectedNodes[i].label === node.label) {
                                    scope.selectedNodes.splice(i, 1);
                                }
                            }
                            if (ivTooltip) {
                                ivTooltip.close();
                            }
                        };

                        $log.log("interactors array");
                        $log.log(interactorsArr);


                        var iv = interactionsViewer()
                            .data(interactorsArr.sort(function (a, b) {
                                // Sort interactors alphabetically
                                if (a.label < b.label) return -1;
                                if (a.label > b.label) return 1;
                                return 0;
                            }))
                            .size(600)
                            .labelSize(90)
                            // .on("click", function (d) {
                            //     console.log("clicked on node...", d);
                            // })
                            .on("mouseout", function () {
                                hover_tooltip.close();
                            })
                            .on("mouseover", mouseoverTooltip)
                            .on("select", function (selectedNode) {
                                // We process the selected Node to offer provenance by source
                                selectedNode.sources = {};
                                for (var inter in selectedNode.interactsWith) {
                                    if (selectedNode.interactsWith.hasOwnProperty(inter)) {
                                        for (var i=0; i<selectedNode.interactsWith[inter].provenance.length; i++) {
                                            var prov = selectedNode.interactsWith[inter].provenance[i];
                                            if (!selectedNode.sources[prov.source]) {
                                                selectedNode.sources[prov.source] = {
                                                    total: 0
                                                };
                                            }
                                            selectedNode.sources[prov.source][inter] = true;
                                            selectedNode.sources[prov.source].total = Object.keys(selectedNode.sources[prov.source]).length - 1;
                                        }
                                    }
                                }
                                scope.selectedNodes.push(selectedNode);
                                scope.$apply();
                            })
                            .on("unselect", function (unselectedNode) {
                                for (var i = 0; i < scope.selectedNodes.length; i++) {
                                    if (scope.selectedNodes[i].label === unselectedNode.label) {
                                        scope.selectedNodes.splice(i, 1);
                                    }
                                }
                                if (ivTooltip) {
                                    ivTooltip.close();
                                }
                                scope.$apply();
                            })
                            .on("interaction", function (interactors) {
                                $log.log(interactors);
                                var elem = this;
                                var obj = {};
                                // obj.header = iNames.join(" - ") + " interactions";
                                obj.header = interactors.interactor1 + " - " + interactors.interactor2 + " interaction";
                                obj.rows = [];

                                // Differenciate between sources
                                var reactome = [];
                                var omnipathDB = [];
                                interactors.provenance.forEach(function (p) {
                                    if (p.source === "Reactome") {
                                        reactome.push(p);
                                    } else if (p.source === "OmnipathDB") {
                                        omnipathDB.push (p);
                                    }
                                });

                                // Show reactome entries:
                                if (reactome.length) {
                                    obj.rows.push({
                                        "label": "Shared pathways (" + reactome.length + ")",
                                        "value": ""
                                    });
                                    var targetOptions = [interactors.interactor1, interactors.interactor2].map(function (o) {
                                        return '&pathway-target=' + o;
                                    }).join('');
                                    reactome.forEach(function (i) {
                                        obj.rows.push({
                                            "value": '<a href="/summary?pathway=' + i.id + targetOptions + '">' + i.label + '</a>',
                                            // "value": i.label,
                                            "label": "Pathway"
                                        });
                                    });
                                }

                                // Show OmnipathDB entries:
                                if (omnipathDB.length) {
                                    obj.rows.push({
                                        "label": "Interactions (" + omnipathDB.length + ")",
                                        "value": ""
                                    });
                                    omnipathDB.forEach (function (i) {
                                        obj.rows.push({
                                            "value": i.id,
                                            "label": "OmnipathDB"
                                        })
                                    });
                                }

                                scope.reactome = reactome;
                                $log.log(scope.reactome);
                                scope.omnipathdb = omnipathDB;
                                $log.log(scope.omnipathdb);

                                ivTooltip = tooltip.table()
                                    .width(180)
                                    .id(1)
                                    .call(elem, obj);
                            });
                        $timeout(function () {
                            scope.showSpinner = false;
                            iv(document.getElementById("interactionsViewerMultipleTargets"));
                        }, 0);

                    });
            })
        }
    }

}]);