angular.module('otDirectives')
    .directive('otDrugSummary', ['$http', '$q', 'otApi', 'otUtils', function ($http, $q, otApi, otUtils) {
        'use strict';

        function pngToDataUrl (url, callback, outputFormat) {
            var img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = function () {
                var canvas = document.createElement('CANVAS');
                var ctx = canvas.getContext('2d');
                var dataURL;
                canvas.height = this.height;
                canvas.width = this.width;
                ctx.drawImage(this, 0, 0);
                dataURL = canvas.toDataURL(outputFormat);
                callback(dataURL);
                canvas = null;
            };
            img.onerror = function (e) {
                // If the image is not found we get a 404 error and ugly broken image icon
                // In that case we invoke the callback with no data so that we can hide the image instead
                callback(undefined);
            };
            img.src = url;
        }

        return {
            restrict: 'E',
            templateUrl: 'src/components/drug-summary/drug-summary.html',
            scope: {
                drug: '='
            },
            link: function (scope) {
                scope.$watch('drug', function () {
                    if (!scope.drug) {
                        return;
                    }

                    // Get the information for the drug...
                    $http.get('https://www.ebi.ac.uk/chembl/api/data/molecule/' + scope.drug)
                        .then(function (resp) {
                            scope.displayName = resp.data.pref_name || resp.data.molecule_chembl_id;
                            // scope.mechanism = resp.data.usan_stem_definition || 'NA';
                            scope.mol_type = resp.data.molecule_type || 'NA';
                            scope.first_approval = resp.data.first_approval || 'NA';
                            scope.max_phase = resp.data.max_phase || 'NA';
                            if (resp.data.molecule_properties && resp.data.molecule_properties.full_molformula) {
                                scope.formula = resp.data.molecule_properties.full_molformula;
                            } else {
                                scope.formula = 'NA';
                            }

                            if (scope.mol_type !== 'Antibody') {
                                pngToDataUrl('https://www.ebi.ac.uk/chembl/api/data/image/' + scope.drug, function (base64Img) {
                                    var img = document.getElementById('drugDiagramContainer');
                                    if (base64Img) {
                                        img.setAttribute('src', base64Img);
                                    } else {
                                        img.style.visibility = 'hidden';
                                    }
                                });
                            }
                            return scope.drug;
                        }, function (err) {
                            scope.noDrug = true;
                        })
                        .then(function (drugId) {
                            // Get the mechanism of action...
                            $http.get('https://www.ebi.ac.uk/chembl/api/data/molecule_form/' + drugId)
                                .then(function (resp) {
                                    var molForms = {};
                                    for (var i = 0; i < resp.data.molecule_forms.length; i++) {
                                        var form = resp.data.molecule_forms[i];
                                        molForms[form.molecule_chembl_id] = true;
                                        molForms[form.parent_chembl_id] = true;
                                    }

                                    var promises = [];
                                    Object.keys(molForms).forEach(function (mol) {
                                        promises.push($http.get('https://www.ebi.ac.uk/chembl/api/data/mechanism?molecule_chembl_id=' + mol));
                                    });
                                    $q.all(promises)
                                        .then(function (resps) {
                                            // var allMecs = [];
                                            // In order to properly show/hide teh spinner, we want to know if there will be any mechanism of action
                                            // and we already know that from hte response.
                                            var anymech = resps.filter(function (rsp) {
                                                return rsp.data.mechanisms.length > 0;
                                            });
                                            var allMecs = anymech.length === 0 ? undefined : [];
                                            scope.mechanisms = allMecs;
                                            for (var i = 0; i < resps.length; i++) {
                                                var mecs = resps[i].data.mechanisms;
                                                for (var j = 0; j < mecs.length; j++) {
                                                    var mec = mecs[j].mechanism_of_action;
                                                    var target = mecs[j].target_chembl_id;
                                                    var refs = mecs[j].mechanism_refs;
                                                    (function (mec, refs) { // make sure mec and refs are passed to the closure and are not mutated while making the calls
                                                        $http.get('https://www.ebi.ac.uk/chembl/api/data/target?target_chembl_id=' + target)
                                                            .then(function (resp) {
                                                                var targetNames = [];
                                                                for (var i = 0; i < resp.data.targets.length; i++) {
                                                                    var target = resp.data.targets[i];
                                                                    var uniqSyns = {};
                                                                    for (var j = 0; j < target.target_components.length; j++) {
                                                                        var component = target.target_components[j];
                                                                        for (var k = 0; k < component.target_component_synonyms.length; k++) {
                                                                            var synonym = component.target_component_synonyms[k];
                                                                            if (synonym.syn_type === 'GENE_SYMBOL') {
                                                                                uniqSyns[synonym.component_synonym.trim()] = {};
                                                                            }
                                                                        }
                                                                    }
                                                                    // Try to find the synonyms in ot
                                                                    var opts = {
                                                                        q: Object.keys(uniqSyns),
                                                                        filter: 'target',
                                                                        search_profile: 'target'
                                                                    };

                                                                    var queryObject = {
                                                                        method: 'POST',
                                                                        params: opts
                                                                    };
                                                                    (function (uniqSyns, target) { // make sure uniqSyns and target and passed to the closure and don't mutate
                                                                        otApi.getBestHitSearch(queryObject)
                                                                            .then(function (resp) {
                                                                                var uniqSynsArr = Object.keys(uniqSyns).map(function (s) {
                                                                                    return {
                                                                                        synonym: s
                                                                                    };
                                                                                });
                                                                                for (var i = 0; i < resp.body.data.length; i++) {
                                                                                    var q = resp.body.data[i];
                                                                                    if (q.id) {
                                                                                        uniqSynsArr[i].ensId = q.id;
                                                                                    }
                                                                                }
                                                                                return uniqSynsArr;
                                                                            })
                                                                            .then(function (uniqSynsArr) {
                                                                                targetNames.push(target.pref_name);
                                                                                allMecs.push({
                                                                                    mechanism: mec,
                                                                                    targets: targetNames.join(', '),
                                                                                    synonyms: uniqSynsArr,
                                                                                    refs: refs
                                                                                });
                                                                            });
                                                                    })(uniqSyns, target);
                                                                }
                                                            });
                                                    })(mec, refs);
                                                }
                                            }
                                        });
                                });

                            // Get the information for the drug...
                            return $http.get('https://www.ebi.ac.uk/chembl/api/data/molecule/' + drugId)
                                .then(function (resp) {
                                    scope.displayName = resp.data.pref_name || resp.data.molecule_chembl_id;
                                    // scope.mechanism = resp.data.usan_stem_definition || 'NA';
                                    scope.mol_type = resp.data.molecule_type || 'NA';
                                    scope.first_approval = resp.data.first_approval || 'NA';
                                    scope.max_phase = resp.data.max_phase || 'NA';
                                    if (resp.data.molecule_properties && resp.data.molecule_properties.full_molformula) {
                                        scope.formula = resp.data.molecule_properties.full_molformula;
                                    } else {
                                        scope.formula = 'NA';
                                    }

                                    if (scope.mol_type !== 'Antibody') {
                                        pngToDataUrl('https://www.ebi.ac.uk/chembl/api/data/image/' + drugId, function (base64Img) {
                                            var img = document.getElementById('drugDiagramContainer');
                                            if (base64Img) {
                                                img.setAttribute('src', base64Img);
                                            } else {
                                                img.style.visibility = 'hidden';
                                            }
                                        });
                                    }
                                    return scope.displayName;
                                });
                        })
                        .then(function (drugName) {
                            if (!drugName) {
                                return;
                            }
                            // Make a new call to OT search with this drug name only for targets...
                            otApi.getSearch({
                                method: 'GET',
                                params: {
                                    q: drugName,
                                    size: 100,
                                    filter: 'target',
                                    search_profile: 'drug'
                                }
                            })
                                .then(function (targetsResp) {
                                    scope.targets = targetsResp.body.data.map(function (t) {
                                        return {
                                            id: t.id,
                                            name: t.data.approved_symbol
                                        };
                                    }).sort(function (a, b) {
                                        return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0;
                                    });
                                    if (scope.targets.length > 1) {
                                        scope.batchSearchTargets = otUtils.compressTargetIds(scope.targets.map(function (d) {
                                            return d.id;
                                        })).join(',');
                                    }
                                });

                            // Same for diseases...
                            otApi.getSearch({
                                method: 'GET',
                                params: {
                                    q: drugName,
                                    size: 100,
                                    filter: 'disease',
                                    search_profile: 'drug'
                                }
                            })
                                .then(function (diseasesResp) {
                                    scope.diseases = diseasesResp.body.data.map(function (d) {
                                        return {
                                            id: d.id,
                                            label: otUtils.ucFirst(d.data.efo_label)
                                        };
                                    }).sort(function (a, b) {
                                        return (a.label < b.label) ? -1 : (a.label > b.label) ? 1 : 0;
                                    });
                                });
                        });
                });
            }
        };
    }]);
