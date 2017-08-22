angular.module('cttvDirectives')

    .directive ('multipleTargetsInteractionsSummary', ['$log', 'cttvAPIservice', '$http', '$q', '$timeout', 'cttvUtils', 'omnipathdbSources', function ($log, cttvAPIservice, $http, $q, $timeout, cttvUtils, omnipathdbSources) {
        'use strict';

        return {
            restrict: 'E',
            template: '<!-- hint -->' +
            '<div>' +
            '    <p class="cttv-section-intro">Summary of interactions for the set of targets based on <a target=_blank href="http://omnipathdb.org/">OmniPath DB</a> data. When 2 targets are selected details on the interaction are shown.</p>' +
            '</div>' +
            '<interactors-star-plot interactors="interactors" categories="categories"></interactors-star-plot>',
            scope: {
                target: '=',
                width: '='
            },
            link: function (scope, element, attrs) {
            // var ivTooltip; // the tooltip for the interaction viewer.

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
                    // var preFlightUrl = '/proxy/www.reactome.org/AnalysisService/identifiers/projection?pageSize=1&page=1&resource=UNIPROT';
                    // var postData = uniprotIds.join('\n');
                    var p1 = $q(function(resolve, reject) {
                        resolve({data: []});
                    });
                    // var p1 = $http.post(preFlightUrl, postData)
                    //     .then (function (resp) {
                    //         return resp.data;
                    //     })
                    //     .then (function (data) {
                    //         var token = data.summary.token;
                    //         var nPathways = data.pathwaysFound;
                    //         var url = '/proxy/www.reactome.org/AnalysisService/token/' + token + '?pageSize=' + nPathways + '&page=1&resource=UNIPROT';
                    //         return $http.get(url)
                    //             .then (function (resp) {
                    //                 var token = resp.data.summary.token;
                    //                 var url2 = '/proxy/www.reactome.org/AnalysisService/token/' + token + '/found/all';
                    //
                    //                 var idsArr = [];
                    //                 for (var i=0; i<resp.data.pathways.length; i++) {
                    //                     var o = resp.data.pathways[i];
                    //                     ids2names[o.stId] = o.name;
                    //                     idsArr.push(o.stId);
                    //                 }
                    //                 var postData2 = idsArr.join(',');
                    //                 return $http.post(url2, postData2)
                    //                     .then (function (targetPathways) {
                    //                         return targetPathways;
                    //                     });
                    //             });
                    //     });

                    // Get data from omnipathdb...
                    var url = '/proxy/www.omnipathdb.org/interactions/' + uniprotIds.join(',') + '?format=json&fields=sources';
                    var p2 = $http.get(url)
                        .then(function (resp) {
                            return resp;
                        });

                    // Sources filter (store the source and the number of interactions it supports)
                    // var sources = {};
                    var sourceCategories = {};

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
                                            };
                                        }
                                        if (!interactors[i2]) {
                                            interactors[i2] = {
                                                label: i2,
                                                interactsWith: {}
                                            };
                                        }
                                        if (!interactors[i1].interactsWith[i2]) {
                                            interactors[i1].interactsWith[i2] = {
                                                label: i2,
                                                provenance: []
                                            };
                                        }
                                        if (!interactors[i2].interactsWith[i1]) {
                                            interactors[i2].interactsWith[i1] = {
                                                label: i1,
                                                provenance: []
                                            };
                                        }
                                        // Record in sources filter
                                        if (!sourceCategories.Pathways) {
                                            sourceCategories.Pathways = 0;
                                        }
                                        sourceCategories.Pathways++;


                                        interactors[i1].interactsWith[i2].provenance.push({
                                            id: pName,
                                            label: ids2names[pName],
                                            source: 'Reactome',
                                            category: 'Pathways'
                                        });
                                        interactors[i2].interactsWith[i1].provenance.push({
                                            id: pName,
                                            label: ids2names[pName],
                                            source: 'Reactome',
                                            category: 'Pathways'
                                        });
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
                                        };
                                    }
                                    if (!interactors[target]) {
                                        interactors[target] = {
                                            label: target,
                                            interactsWith: {}
                                        };
                                    }
                                    if (!interactors[source].interactsWith[target]) {
                                        interactors[source].interactsWith[target] = {
                                            label: target,
                                            provenance: []
                                        };
                                    }
                                    if (!interactors[target].interactsWith[source]) {
                                        interactors[target].interactsWith[source] = {
                                            label: source,
                                            provenance: []
                                        };
                                    }
                                    // interactors[source].interactsWith[target].provenance.push({
                                    //     id: "IntAct",
                                    //     label: "PPI",
                                    //     source: 'IntAct'
                                    // });
                                    for (var f=0; f<provenance.length; f++) {
                                        var prov = provenance[f];
                                        var sourceCat = omnipathdbSources[prov];
                                        if (!sourceCat) {
                                            $log.warn('omnipath source ' + prov + ' does not have a category -- skipping source');
                                            continue;
                                        }

                                        if (!sourceCategories[sourceCat]) {
                                            sourceCategories[sourceCat] = 0;
                                        }
                                        // sources[prov]++;
                                        sourceCategories[sourceCat]++;
                                        interactors[source].interactsWith[target].provenance.push({
                                            id: prov,
                                            label: prov,
                                            source: prov,
                                            category: sourceCat
                                        });
                                        interactors[target].interactsWith[source].provenance.push({
                                            id: prov,
                                            label: prov,
                                            source: prov,
                                            category: sourceCat
                                        });
                                    }
                                // interactors[source].interactsWith[target].provenance = provenance;
                                }
                            }
                            scope.categories = sourceCategories;
                            scope.interactors = interactors;

                        });
                });
            }
        };

    }]);