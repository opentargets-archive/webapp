angular.module('cttvDirectives')

.directive ('multipleTargetsInteractionsSummary', ['$log', 'cttvAPIservice', '$http', '$q', '$timeout', function ($log, cttvAPIservice, $http, $q, $timeout) {
    'use strict';

    return {
        restrict: 'E',
        // template: '<cttv-progress-spinner ng-show="scope.showSpinner"></cttv-progress-spinner><div id="interactionsViewerMultipleTargets"></div>',
        templateUrl: 'partials/multiple-targets-interactions-summary.html',
        scope: {
            target: '=',
            associations: '=',
            width: '='
        },
        link: function (scope, element, attrs) {
            scope.$watchGroup(['target', 'associations'], function () {
                if (!scope.target || !scope.associations) {
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

                // Get Pathways data from Reactome
                // Get enrichment analysis from reactome
                // http://www.reactome.org/AnalysisService/identifiers/projection/\?pageSize\=1\&page\=1 POST
                var preFlightUrl = '/proxy/www.reactome.org/AnalysisService/identifiers/projection?pageSize=1&page=1&resource=UNIPROT';
                var postData = uniprotIds.join('\n');
                $http.post(preFlightUrl, postData)
                    .then (function (resp) {
                        return resp.data;
                    })
                    .then (function (data) {
                        var token = data.summary.token;
                        var nPathways = data.pathwaysFound;
                        var url = '/proxy/www.reactome.org/AnalysisService/token/' + token + '?pageSize=' + nPathways + '&page=1&resource=UNIPROT';
                        $http.get(url)
                            .then (function (resp) {
                                var token = resp.data.summary.token;
                                var url2 = '/proxy/www.reactome.org/AnalysisService/token/' + token + '/found/all';

                                // Save a pathway Id => pathway label map to refer to pathway maps later
                                var ids2names = {};
                                var idsArr = [];
                                for (var i=0; i<resp.data.pathways.length; i++) {
                                    var o = resp.data.pathways[i];
                                    ids2names[o.stId] = o.name;
                                    idsArr.push(o.stId);
                                }
                                var postData2 = idsArr.join(',');
                                $http.post(url2, postData2)
                                    .then (function (targetPathways) {
                                        $log.log("targetPathways...");
                                        $log.log(targetPathways);
                                        var targets4pathways = {};
                                        for (var k=0; k<targetPathways.data.length; k++) {
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
                                            for (var i=0; i<p.length; i++) {
                                                var i1 = mapNames[p[i].id];
                                                for (var j=1; j<p.length; j++) {
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
                                                    interactors[i1].interactsWith[i2].provenance.push({
                                                        id: pName,
                                                        label: ids2names[pName]
                                                    });
                                                    // interactors[i2].interactsWith[i1].provenance.push({
                                                    //     id: pName,
                                                    //     label: ids2names[pName]
                                                    // })
                                                }
                                            }
                                        }

                                        var interactorsArr = Object.values(interactors);

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
                                        scope.selectedNodes = [];
                                        scope.unselectNode = function (node) {
                                            iv.click(node);
                                            for (var i = 0; i < scope.selectedNodes.length; i++) {
                                                if (scope.selectedNodes[i].label === node.label) {
                                                    scope.selectedNodes.splice(i, 1);
                                                }
                                            }
                                        };

                                        var iv = interactionsViewer()
                                            .data(interactorsArr)
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
                                                scope.selectedNodes.push(selectedNode);
                                                scope.$apply();
                                            })
                                            .on("unselect", function (unselectedNode) {
                                                for (var i=0; i<scope.selectedNodes.length; i++) {
                                                    if (scope.selectedNodes[i].label === unselectedNode.label) {
                                                        scope.selectedNodes.splice(i, 1);
                                                    }
                                                }
                                                scope.$apply();
                                            })
                                            .on("interaction", function (interactors) {
                                                $log.log("interactors...");
                                                $log.log(interactors);
                                                debugger;
                                                // Take the interactions between both:
                                                const elem = this;
                                                var obj = {};
                                                // obj.header = iNames.join(" - ") + " interactions";
                                                obj.header = interactors.interactor1 + " - " + interactors.interactor2 + " interaction";
                                                obj.rows = [];
                                                obj.rows.push({
                                                    "label": "Pathways",
                                                    "value": ""
                                                });
                                                var targetOptions = [interactors.interactor1, interactors.interactor2].map(function (o) {
                                                    return '&pathway-target=' + o;
                                                }).join ('');
                                                interactors.provenance.forEach(function (i) {
                                                    obj.rows.push({
                                                        "value": '<a href="/summary?pathway=' + i.id + targetOptions + '">' + i.label + '</a>',
                                                        "label": "Pathway"
                                                    });
                                                });
                                                tooltip.table()
                                                    .width(180)
                                                    .id(1)
                                                    .call(elem, obj);
                                            });
                                        $timeout(function () {
                                            scope.showSpinner = false;
                                            iv(document.getElementById("interactionsViewerMultipleTargets"));
                                        }, 0);

                                    });
                            });
                    });


                // Get all the data...
                // var url = "/proxy/www.omnipathdb.org/interactions/" + uniprotIds.join(',') + '?format=json&fields=sources';
                // $http.get(url)
                //     .then (function (resp) {
                //         for (var i=0; i<resp.data.length; i++) {
                //             var link = resp.data[i];
                //             var source = mapNames[link.source];
                //             var target = mapNames[link.target];
                //             var provenances = link.sources;
                //
                //             if (source && target) {
                //                 if (!interactors[source].interactsWith[target]) {
                //                     interactors[source].interactsWith[target] = {
                //                         label: target,
                //                         provenance: []
                //                     };
                //                     // interactors[source].interactsWith.push(target);
                //                 }
                //                 if (!interactors[target].interactsWith[source]) {
                //                     interactors[target].interactsWith[source] = {
                //                         label: source,
                //                         provenance: []
                //                     };
                //                     // interactors[target].interactsWith.push(source);
                //                 }
                //
                //                 provenances.forEach(function (provenance) {
                //                     if (_.indexOf(interactors[source].interactsWith[target].provenance, provenance) === -1) {
                //                         interactors[source].interactsWith[target].provenance.push(provenance);
                //                     }
                //                     if (_.indexOf(interactors[target].interactsWith[source].provenance, provenance) === -1) {
                //                         interactors[target].interactsWith[source].provenance.push(provenance);
                //                     }
                //
                //
                //                 })
                //
                //             }
                //         }

                        // Parse therapeutic area information
                        // var indexByTas = {};
                        // for (var j=0; j<scope.associations.data.length; j++) {
                        //     var assoc = scope.associations.data[j];
                        //     var tas = assoc.disease.efo_info.therapeutic_area.labels;
                        //     for (var k=0; k<tas.length; k++) {
                        //         if (!indexByTas[tas[k]]) {
                        //             indexByTas[tas[k]] = {};
                        //         }
                        //         // indexByTas[tas[k]].push(assoc.target.gene_info.symbol);
                        //         indexByTas[tas[k]][assoc.target.gene_info.symbol] = true;
                        //     }
                        // }
                        // var tas = Object.keys(indexByTas);
                        // for (var k1=0; k1<tas.length; k1++) {
                        //     var ta = tas[k1];
                        //     var targets = Object.keys(indexByTas[ta]);
                        //     for (var m=0; m<targets.length-1; m++) {
                        //         var t1 = targets[m];
                        //         for (var n=m+1; n<targets.length; n++) {
                        //             var t2 = targets[n];
                        //             // TODO: interactors has been indexed by target's approved symbol but this doesn't always correspond to the association's target symbol
                        //             if(!interactors[t1] || !interactors[t2]) {
                        //                 continue;
                        //             }
                        //             if (!interactors[t1].interactsWith[t2]) {
                        //                 interactors[t1].interactsWith[t2] = {
                        //                     label: t2,
                        //                     provenance: []
                        //                 }
                        //             }
                        //             if (!interactors[t2].interactsWith[t1]) {
                        //                 interactors[t2].interactsWith[t1] = {
                        //                     label: t1,
                        //                     provenance: []
                        //                 }
                        //             }
                        //             interactors[t1].interactsWith[t2].provenance.push("therapeutic_area");
                        //         }
                        //     }
                        // }

                        // var interactorsArr = [];
                        // _.forEach(interactors, function (link, index) {
                        //     link.label = index;
                        //     interactorsArr.push(link);
                        // });


/*
                        let filtered = {};
                        // First pass -- get all uniprot Ids associated with our protein
                        let interactors = new Set();
                        for (let link of data) {
                            let {source, target} = link;
                            if (source === uniprotId) {
                                interactors.add(target);
                            }
                            if (target === uniprotId) {
                                interactors.add(source);
                            }
                        }

                        for (let interactor of interactors) {
                            filtered[interactor] = {
                                label: interactor,
                                interactsWith: new Set()
                            }
                        }

                        for (let link of data) {
                            let {source, target} = link;
                            if (interactors.has(source) && interactors.has(target)) {
                                if ((source !== uniprotId) && (target !== uniprotId)) {
                                    filtered[source].interactsWith.add(target);
                                    filtered[target].interactsWith.add(source); // TODO: For now this gets duplicated.
                                }
                            }
                        }

                        // Return the array
                        let omnipathData = Object.keys(filtered).map((k) = > filtered[k]
                        )
                        console.log(omnipathData);
*/


                    // })
            })
        }
    }

}]);