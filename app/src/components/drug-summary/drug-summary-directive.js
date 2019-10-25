angular.module('otDirectives')
    .directive('otDrugSummary', ['otApi', 'otUtils', 'otDictionary', 'otUpperCaseFirstFilter', function (otApi, otUtils, otDictionary, otUpperCaseFirstFilter) {
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

                    // Get the information for the drug from API
                    otApi.getDrug({
                        method: 'GET',
                        params: {
                            id: scope.drug
                        }
                    })
                        .then(
                            function (resp) {
                                // General properties
                                var data = resp.body.data[0];
                                scope.displayName = otUpperCaseFirstFilter((data.pref_name || data.molecule_chembl_id).toString().toLowerCase());
                                scope.molType = data.type || otDictionary.NA;
                                scope.firstApproval = data.year_first_approved || otDictionary.NA;
                                scope.maxPhase = data.max_clinical_trial_phase || otDictionary.NA;
                                scope.internal = data.internal_compound;
                                scope.synonyms = data.synonyms;
                                scope.tradeNames = data.trade_names;
                                scope.isWithdrawn = data.withdrawn_flag;
                                scope.withdrawnYear = data.withdrawn_year;
                                scope.withdrawnCountry = data.withdrawn_country;
                                scope.withdrawnReason = data.withdrawn_reason;
                                scope.withdrawnClass = data.withdrawn_class;
                                scope.adverseEvents = data.adverse_events;

                                // TODO: full_molformula is currently not available in the API response
                                // if (data.molecule_properties && data.molecule_properties.full_molformula) {
                                //     scope.formula = data.molecule_properties.full_molformula;
                                // } else {
                                //     scope.formula = otDictionary.NA;
                                // }

                                if (!scope.internal && scope.molType.toLowerCase() !== 'antibody') {
                                    pngToDataUrl('https://www.ebi.ac.uk/chembl/api/data/image/' + scope.drug, function (base64Img) {
                                        var img = document.getElementById('drugDiagramContainer');
                                        if (base64Img) {
                                            img.setAttribute('src', base64Img);
                                        } else {
                                            img.style.visibility = 'hidden';
                                        }
                                    });
                                }

                                // Mechanism of action
                                var mecs = data.mechanisms_of_action.map(function (mec) {
                                    (mec.references || []).map(function (ref) {
                                        // process the references
                                        ref.url = ref.urls ? ref.urls[0] : '';
                                        if (ref.source.toLowerCase() === 'wikipedia') {
                                            ref.url = 'https://en.wikipedia.org/wiki/' + ref.ids[0];
                                        }
                                        if (ref.source.toLowerCase() === 'fda') {
                                            ref.url = 'http://www.accessdata.fda.gov/drugsatfda_docs/' + ref.ids[0];
                                        }
                                        return ref;
                                    });
                                    return mec;
                                });
                                scope.mechanisms = mecs;

                                // Associated targets
                                otApi.getSearch({
                                    method: 'GET',
                                    params: {
                                        q: scope.displayName,
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

                                // Associated diseases
                                otApi.getSearch({
                                    method: 'GET',
                                    params: {
                                        q: scope.displayName,
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
                            },
                            function (err) {
                                // no drug data?
                                scope.noDrug = true;
                            }
                        );
                });
            }
        };
    }]);
