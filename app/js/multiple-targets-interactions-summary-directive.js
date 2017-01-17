angular.module('cttvDirectives')

.directive ('multipleTargetsInteractionsSummary', ['$log', 'cttvAPIservice', '$http', '$timeout', function ($log, cttvAPIservice, $http, $timeout) {
    'use strict';

    return {
        restrict: 'E',
        template: '<cttv-progress-spinner ng-show="scope.showSpinner"></cttv-progress-spinner><div id="interactionsViewerMultipleTargets"></div>',
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
                        interactsWithObj: {},
                        interactsWith: []
                    };
                    if (d.uniprot_id) {
                        uniprotIds.push(d.uniprot_id);
                    }
                });

                // Get all the data...
                var url = "/proxy/www.omnipathdb.org/interactions/" + uniprotIds.join(',') + '?format=json&fields=sources';
                $http.get(url)
                    .then (function (resp) {
                        for (var i=0; i<resp.data.length; i++) {
                            var link = resp.data[i];
                            var source = mapNames[link.source];
                            var target = mapNames[link.target];
                            var provenances = link.sources;

                            if (source && target) {
                                if (!interactors[source].interactsWith[target]) {
                                    interactors[source].interactsWith[target] = {
                                        label: target,
                                        provenance: []
                                    };
                                    // interactors[source].interactsWith.push(target);
                                }
                                if (!interactors[target].interactsWith[source]) {
                                    interactors[target].interactsWith[source] = {
                                        label: source,
                                        provenance: []
                                    };
                                    // interactors[target].interactsWith.push(source);
                                }

                                provenances.forEach(function (provenance) {
                                    if (_.indexOf(interactors[source].interactsWith[target].provenance, provenance) === -1) {
                                        interactors[source].interactsWith[target].provenance.push(provenance);
                                    }
                                    if (_.indexOf(interactors[target].interactsWith[source].provenance, provenance) === -1) {
                                        interactors[target].interactsWith[source].provenance.push(provenance);
                                    }


                                })

                            }
                        }

                        // Parse therapeutic area information
                        var indexByTas = {};
                        for (var j=0; j<scope.associations.data.length; j++) {
                            var assoc = scope.associations.data[j];
                            var tas = assoc.disease.efo_info.therapeutic_area.labels;
                            for (var k=0; k<tas.length; k++) {
                                if (!indexByTas[tas[k]]) {
                                    indexByTas[tas[k]] = {};
                                }
                                // indexByTas[tas[k]].push(assoc.target.gene_info.symbol);
                                indexByTas[tas[k]][assoc.target.gene_info.symbol] = true;
                            }
                        }
                        var tas = Object.keys(indexByTas);
                        for (var k1=0; k1<tas.length; k1++) {
                            var ta = tas[k1];
                            var targets = Object.keys(indexByTas[ta]);
                            for (var m=0; m<targets.length-1; m++) {
                                var t1 = targets[m];
                                for (var n=m+1; n<targets.length; n++) {
                                    var t2 = targets[n];
                                    // TODO: interactors has been indexed by target's approved symbol but this doesn't always correspond to the association's target symbol
                                    if(!interactors[t1] || !interactors[t2]) {
                                        continue;
                                    }
                                    if (!interactors[t1].interactsWith[t2]) {
                                        interactors[t1].interactsWith[t2] = {
                                            label: t2,
                                            provenance: []
                                        }
                                    }
                                    if (!interactors[t2].interactsWith[t1]) {
                                        interactors[t2].interactsWith[t1] = {
                                            label: t1,
                                            provenance: []
                                        }
                                    }
                                    interactors[t1].interactsWith[t2].provenance.push("therapeutic_area");
                                }
                            }
                        }

                        var interactorsArr = [];
                        _.forEach(interactors, function (link, index) {
                            link.label = index;
                            interactorsArr.push(link);
                        });

                        var iv = interactionsViewer()
                            .data(interactorsArr)
                            .size(600)
                            .labelSize(90)
                            .on("click", function (d) {
                                console.log("clicked on node...", d);
                            });


                        $timeout(function () {
                            scope.showSpinner = false;
                            iv(document.getElementById("interactionsViewerMultipleTargets"));
                        }, 0);


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


                    })
            })
        }
    }

}]);