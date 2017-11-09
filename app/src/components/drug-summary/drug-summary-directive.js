angular.module('otDirectives')
    .directive('otDrugSummary', ['$http', '$q', 'otApi', 'otUtils', function ($http, $q, otApi, otUtils) {
        'use strict';

        function pngToDataUrl(url, callback, outputFormat) {
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

                    var promise = $q(function (res) {
                        res(scope.drug);
                    });
                    if (scope.drug.indexOf('CHEMBL') !== 0) {
                        promise = $http.get('https://www.ebi.ac.uk/chembl/api/data/chembl_id_lookup/search?q=' + scope.drug)
                            .then(function (resp) {
                                return resp.data.chembl_id_lookups[0].chembl_id;
                            })
                    }

                    promise.then(function (drugId) {
                        scope.drugId = drugId;

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
                                        var allMecs = [];
                                        scope.mechanisms = allMecs;
                                        for (var i = 0; i < resps.length; i++) {
                                            var mecs = resps[i].data.mechanisms;
                                            for (var j = 0; j < mecs.length; j++) {
                                                var mec = mecs[j].mechanism_of_action;
                                                var target = mecs[j].target_chembl_id;
                                                var refs = mecs[j].mechanism_refs;
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
                                                                        uniqSyns[synonym.component_synonym] = true;
                                                                    }
                                                                }
                                                            }
                                                            targetNames.push(target.pref_name);
                                                            allMecs.push({
                                                                mechanism: mec,
                                                                targets: targetNames.join(', '),
                                                                synonyms: Object.keys(uniqSyns).join(', '),
                                                                refs: refs
                                                            });
                                                        }
                                                    });
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
                                        img.setAttribute('src', base64Img);
                                    });
                                }
                                return scope.displayName;
                            });

                    })
                        .then(function (drugName) {
                            // Make a new call to OT search with this drug name only for targets...
                            otApi.getSearch({
                                method: 'GET',
                                params: {
                                    q: drugName,
                                    size: 100,
                                    filter: 'target'
                                }
                            })
                                .then (function (targetsResp) {
                                    scope.targets = targetsResp.body.data.map(function (t) {
                                        return {
                                            id: t.id,
                                            name: t.data.approved_symbol
                                        };
                                    }).sort(function (a, b) {
                                        return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0;
                                    });
                                });

                            // Same for diseases...
                            otApi.getSearch({
                                method: 'GET',
                                params: {
                                    q: drugName,
                                    size: 100,
                                    filter: 'disease'
                                }
                            })
                                .then (function (diseasesResp) {
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
