angular.module('otPlugins')
    .directive('interactionsViewer', ['$log',  '$http', '$q', 'otApi', 'otOmnipathdbSources', function ($log, $http, $q, otApi, otOmnipathdbSources) {
        function getNames (bestHits) {
            var mapNames = {};
            for (var i = 0; i < bestHits.length; i++) {
                var bestHit = bestHits[i];

                // TODO: There are cases where the bestHitSearch doesn't give anything back. For now, we filter them out
                if (bestHit.data) {
                    mapNames[bestHit.q] = {
                        approved_symbol: bestHit.data.approved_symbol,
                        association_counts: bestHit.data.association_counts,
                        uniprot_id: bestHit.q,
                        ensembl_id: bestHit.data.ensembl_gene_id
                    };
                }
            }
            return mapNames;
        }

        return {
            restrict: 'E',
            // template: '<!-- hint -->' +
            // '<div>' +
            // '    <p class="ot-section-intro">Summary of interactions for {{target.approved_symbol}} based on <a target=_blank href="http://omnipathdb.org/">OmniPath DB</a> data. When 2 targets are selected details on the interaction are shown.</p>' +
            // '</div>' +
            // '<ot-interactors-star-plot interactors="interactors" categories="categories" selected="target.approved_symbol"></ot-interactors-star-plot>',
            templateUrl: 'plugins/interactions-viewer/interactions-viewer.html',
            scope: {
                target: '=',
                width: '='
            },
            link: function (scope, elem, attrs) {
                var uniprotId = scope.target.uniprot_id;
                var url = '/proxy/www.omnipathdb.org/interactions/' + uniprotId + '?format=json';
                $http.get(url)
                    .then(function (resp) {
                        var interactors = {};

                        for (var i = 0; i < resp.data.length; i++) {
                            var interaction = resp.data[i];
                            interactors[interaction.target] = true;
                            interactors[interaction.source] = true;
                        }

                        var uniprotIds = Object.keys(interactors);

                        // Return a promise with UniprotIds to get sync flow
                        return $q(function (resolve) {
                            resolve(uniprotIds);
                        });
                    })
                    .then(function (uniprotIds) {
                        // If there are not interactors, we don't make any other call
                        if (!uniprotIds.length) {
                            scope.interactors = {};
                            return;
                        }

                        var promises = [];

                        // Promise -- second pass in omnipathdb...
                        var url = '/proxy/www.omnipathdb.org/interactions/' + uniprotIds.join(',') + '?format=json&fields=sources';
                        promises.push($http.get(url));

                        // Promise -- get the names from bestHitSearch
                        var opts = {
                            q: uniprotIds,
                            filter: 'target',
                            fields: ['approved_symbol', 'association_counts', 'ensembl_gene_id']
                        };

                        var queryObject = {
                            method: 'POST',
                            params: opts,
                            trackCall: false
                        };

                        promises.push(otApi.getBestHitSearch(queryObject));

                        // Both promises run in parallel
                        $q.all(promises)
                            .then(function (resps) {
                                // Get the mappings between uniprot ids and gene symbols
                                var mapNames = getNames(resps[1].body.data);


                                // parse the omnipath data
                                var odbData = resps[0].data;

                                var interactors = {};
                                var sourceCategories = {};
                                var missingSources = {};

                                for (var i = 0; i < odbData.length; i++) {
                                    var link = odbData[i];
                                    var sourceObj = mapNames[link.source];
                                    var targetObj = mapNames[link.target];

                                    var source, target;
                                    if (sourceObj) {
                                        source = sourceObj.approved_symbol;
                                    }
                                    if (targetObj) {
                                        target = targetObj.approved_symbol;
                                    }

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
                                        for (var f = 0; f < provenance.length; f++) {
                                            var prov = provenance[f];
                                            var sourceCat = otOmnipathdbSources[prov];
                                            if (!sourceCat) {
                                                if (!missingSources[prov]) {
                                                    missingSources[prov] = 0;
                                                }
                                                missingSources[prov]++;
                                                // $log.warn('omnipath source ' + prov + ' does not have a category -- skipping source');
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

                                // Reporting in the console the omnipath sources that haven't been assigned a category yet. See otOmnipathdbSources and otOmnipathdbCategories
                                if (Object.keys(missingSources).length) {
                                    $log.warn('These omnipath sources does not have a category described and have been skipped');
                                    $log.warn(missingSources);
                                }

                                scope.interactors = interactors;
                                scope.categories = sourceCategories;
                            });
                    });
            }
        };
    }]);
