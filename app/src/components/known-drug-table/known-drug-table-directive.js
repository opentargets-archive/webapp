/**
 * Drugs table
 *
 * ext object params:
 *  isLoading, hasError, data
 */
angular.module('otDirectives')

    /* Directive to display the known drug evidence table */
    .directive('otKnownDrugTable', ['otColumnFilter', 'otApi', 'otConsts', 'otUtils', 'otConfig', '$location', 'otDictionary', function (otColumnFilter, otApi, otConsts, otUtils, otConfig, $location, otDictionary) {
        'use strict';
        // var dbs = otConsts.dbs;
        var searchObj = otUtils.search.translateKeys($location.search());
        var checkPath = otUtils.checkPath;

        return {
            restrict: 'AE',
            templateUrl: 'src/components/known-drug-table/known-drug-table.html',
            scope: {
                // loadFlag: '=?',    // optional load-flag: true when loading, false otherwise. links to a var to trigger spinners etc...
                // data: '=?',        // optional data link to pass the data out of the directive
                // errorFlag: '=?'    // optional error-flag: pass a var to hold parsing-related errors
                title: '@?',       // optional title for filename export - TODO: this clashes with a DOM element 'title' attribute, causing odd behaviours on roll over. Should be removed
                output: '@?',       // optional download file name - this will replace title (see above)
                ext: '=?',       // optional external object to pass things out of the directive; TODO: this should remove teh need for all parameters above
                targetLabel: '@?',
                diseaseLabel: '@?'
            },
            controller: ['$scope', function ($scope) {
                function init () {
                    $scope.drugs = [];
                }

                init();
            }],
            link: function (scope, elem, attrs) {
                // this probably shouldn't live here, so we'll see later on...
                // var accessLevelPrivate = '<span class=\'ot-access-private\' title=\'private data\'></span>';
                // var accessLevelPublic = '<span class=\'ot-access-public\' title=\'public data\'></span>';

                var table, dtable;

                scope.ext.hasError = false;
                scope.output = scope.output || scope.title || ((scope.targetLabel || '') + (scope.targetLabel && scope.diseaseLabel ? '-' : '') + (scope.diseaseLabel || ''));

                scope.$watchGroup([function () { return attrs.target; }, function () { return attrs.disease; }], function () {
                // if (!attrs.target && !attrs.disease) {
                // Wa want to get data when we have both target and disease
                // so it should return here if one or the other are undefined
                    if (!attrs.target && !attrs.disease) { /* TODO */
                        return;
                    }

                    getDrugData();

                    // =================================================
                    //  D R U G S
                    // =================================================

                    /*
                        drug    1   Target context  .biological_subject.properties.target_type
                        drug    2   Protein complex members .biological_subject.about
                        drug    3   Drug information    .evidence.evidence_chain[0].evidence.experiment_specific
                        drug    4   Mechanism of action of drug .biological_subject.properties.activity
                        drug    5   Mechanism of action references  .evidence.evidence_chain[0].evidence.provenance_type.literature.pubmed_refs
                        drug    6   Evidence codes: target to drug  .evidence.evidence_chain[0].evidence.evidence_codes
                        drug    7   Provenance - target .evidence.urls.linkouts[1]
                        drug    8   Provenance - drug   .evidence.urls.linkouts[0]
                        drug    9   Provenace - marketed drug indication; SourceDB  .evidence.evidence_chain[1].evidence.experiment_specific
                        drug    10  Date asserted   .evidence.date_asserted
                        drug    11  Evidence codes: drug to disease .evidence.evidence_chain[1].evidence.evidence_codes
                        drug    12  Association score   .evidence.evidence_chain[0].evidence.association_score
                    */

                    /*
                        Drug Information                                                        Gene-Drug Evidence
                        Drug    Phase   Type    Mechanism of Action Activity    Clinical Trials Target name Target class    Target context  Protein complex members Evidence type
                    */

                    function getDrugData () {
                        scope.ext.isLoading = true;
                        var opts = {
                            size: 10000,
                            datasource: otConfig.evidence_sources.known_drug,
                            fields: [
                                'disease.efo_info',
                                'drug',
                                'evidence',
                                'target',
                                'access_level'
                            ]
                        };
                        if (attrs.target) {
                            opts.target = attrs.target;
                        }
                        if (attrs.disease) {
                            opts.disease = attrs.disease;
                        }
                        _.extend(opts, searchObj);
                        var queryObject = {
                            method: 'GET',
                            params: opts
                        };
                        return otApi.getFilterBy(queryObject)
                            .then(
                                function (resp) {
                                    if (resp.body.data) {
                                        scope.ext.data = resp.body.data;
                                        scope.ext.total = resp.body.total;
                                        scope.ext.size = resp.body.size;
                                        initTableDrugs();
                                        // draw doughnut
                                        // drawPhaseChart(scope.phases);
                                    } else {
                                        // $log.warn("Empty response : drug data");
                                    }
                                },
                                otApi.defaultErrorHandler
                            )
                            .finally(function () {
                                scope.ext.isLoading = false;
                            });
                    }


                    scope.downloadAllData = function () {
                        scope.ext.isDownloading = true;
                        // otGoogleAnalytics.trackEvent('alldrugs', 'download', 'CSV');
                        var size = 10000;
                        var method = 'GET';
                        var totalText = '';
                        function columnsNumberOk (csv, n) {
                            var firstRow = csv.split('\n')[0];
                            var cols = firstRow.split(',');
                            return cols.length === n;
                        }

                        function getNextChunk (nextIndex) {
                            var opts = {
                                size: size,
                                datasource: otConfig.evidence_sources.known_drug,
                                fields: [
                                    'access_level',
                                    'disease.efo_info.efo_id',
                                    'disease.efo_info.label',
                                    'drug.molecule_name',
                                    'evidence.drug2clinic.clinical_trial_phase.label',
                                    'evidence.drug2clinic.clinical_trial_phase.numeric_index',
                                    'evidence.drug2clinic.status',
                                    'drug.molecule_type',
                                    'evidence.target2drug.mechanism_of_action',
                                    // publications??
                                    'target.activity',
                                    'target.gene_info.symbol',
                                    'target.id',
                                    'target.target_class',  // ???
                                    'item.evidence.drug2clinic.urls.url', // ???
                                    'item.evidence.drug2clinic.urls.nice_name' // ???
                                    // 'disease.efo_info.label',
                                    // 'drug.molecule_name',
                                    // 'evidence.target2drug.mechanism_of_action',
                                    // 'evidence.drug2clinic.urls[0].nice_name',
                                    // 'target.gene_info.symbol'
                                ],
                                format: 'csv'
                            };
                            if (attrs.target) {
                                opts.target = attrs.target;
                            }
                            if (attrs.disease) {
                                opts.disease = attrs.disease;
                            }
                            if (nextIndex) {
                                opts.next = nextIndex;
                            }

                            _.extend(opts, searchObj);
                            var queryObject = {
                                method: method,
                                params: opts
                            };

                            return otApi.getFilterBy(queryObject)
                                .then(
                                    function (resp) {
                                        var moreText = resp.body;

                                        if (columnsNumberOk(moreText, opts.fields.length)) {
                                            if (nextIndex) {
                                                // Not in the first page, so remove the header row
                                                moreText = moreText.split('\n').slice(1).join('\n');
                                            }
                                            totalText += moreText;
                                        }
                                    }
                                );
                        }

                        function getNextIndex (nextIndex) {
                            var opts = {
                                size: size,
                                datasource: otConfig.evidence_sources.known_drug,
                                fields: ['thisfielddoesnotexist'] // only interested in the next index
                            };
                            if (attrs.target) {
                                opts.target = attrs.target;
                            }
                            if (attrs.disease) {
                                opts.disease = attrs.disease;
                            }
                            if (nextIndex) {
                                opts.next = nextIndex;
                            }

                            _.extend(opts, searchObj);
                            var queryObject = {
                                method: method,
                                params: opts
                            };

                            return otApi.getFilterBy(queryObject)
                                .then(function (resp) {
                                    return resp.body.next;
                                });
                        }

                        // Makes 2 calls to the api,
                        // The first one to take the next data (in csv)
                        // The second one to take the next index (not returned in csv call)
                        function callNext (nextIndex) {
                            getNextChunk(nextIndex)
                                .then(function () {
                                    return getNextIndex(nextIndex)
                                        .then(function (nextNext) {
                                            if (nextNext) {
                                                callNext(nextNext);
                                            } else {
                                                var b = new Blob([totalText], {type: 'text/csv;charset=utf-8'});
                                                saveAs(b, (scope.output ? scope.output + '-' : '') + 'known_drugs' + '.csv');
                                                scope.ext.isDownloading = false;
                                            }
                                        });
                                });
                        }

                        callNext();
                    };


                    function formatDrugsDataToArray (data) {
                        var newdata = [];
                        var all_drugs = [];
                        var all_phases = {};
                        var type_activity = {};

                        data.forEach(function (item) {
                        // create rows:
                            var row = [];

                            try {
                            // Fill the unique drugs
                                all_drugs.push({
                                    id: item.drug.molecule_name,
                                    url: item.evidence.target2drug.urls[0].url
                                });

                                // 0: data origin: public / private
                                row.push((item.access_level === otConsts.ACCESS_LEVEL_PUBLIC) ? otConsts.ACCESS_LEVEL_PUBLIC_DIR : otConsts.ACCESS_LEVEL_PRIVATE_DIR);

                                // 1: disease name
                                row.push('<a href=\'/disease/' + item.disease.efo_info.efo_id.split('/').pop() + '\'>' + item.disease.efo_info.label + '</a>');

                                // 2: disease id (hidden)
                                row.push(item.disease.efo_info.efo_id.split('/').pop());

                                // 3: drug
                                var link = item.evidence.target2drug.urls[0].url;
                                var linkClass = 'class="ot-external-link"';
                                var target = 'target=_blank';
                                if (item.evidence.target2drug.provenance_type.database.id === 'ChEMBL') {
                                    link = '/summary?drug=' + item.drug.id.split('/').pop();
                                    linkClass = '';
                                    target = '';
                                }
                                row.push('<a ' + linkClass + ' href=\'' + link + '\' ' + target + '>' + item.drug.molecule_name + '</a>');

                                // 4: drug id
                                row.push(item.drug.id.split('/').pop());

                                // 5: phase
                                row.push(item.evidence.drug2clinic.clinical_trial_phase.label);

                                // 6: phase numeric (hidden)
                                row.push(item.evidence.drug2clinic.clinical_trial_phase.numeric_index);

                                // 7: status
                                var sts = otDictionary.NA;
                                if (otUtils.checkPath(item, 'evidence.drug2clinic.status')) {
                                    sts = item.evidence.drug2clinic.status;
                                }
                                row.push(sts);

                                // 8: type
                                row.push(item.drug.molecule_type);

                                // 9: Mechanism of action + publications
                                var action = item.evidence.target2drug.mechanism_of_action;
                                var refs = [];
                                if (checkPath(item, 'evidence.target2drug.provenance_type.literature.references')) {
                                    refs = item.evidence.target2drug.provenance_type.literature.references;
                                }

                                if (refs.length > 0) {
                                    action += '<br />' + otUtils.getPublicationsString(otUtils.getPmidsList(refs));
                                }

                                if (item.evidence.target2drug.urls && item.evidence.target2drug.urls[2]) {
                                    var extLink = item.evidence.target2drug.urls[2];
                                    action += '<br /><span><a class=\'ot-external-link\' target=_blank href=' + extLink.url + '>' + extLink.nice_name  + '</a></span>';
                                }
                                row.push(action);

                                // 10: Mechanism of action references (hidden)
                                row.push(item.evidence.target2drug.urls.map(function (t2d) {
                                    return t2d.nice_name + ': ' + t2d.url;
                                }).join(', '));

                                // 11: Activity
                                var activity = item.target.activity;
                                switch (activity) {
                                case 'drug_positive_modulator' :
                                    activity = 'agonist';
                                    break;
                                case 'drug_negative_modulator' :
                                    activity = 'antagonist';
                                    break;
                                }
                                row.push(activity);

                                // 12: target
                                row.push('<a href=\'/target/' + item.target.id + '\'>' + item.target.gene_info.symbol + '</a>');

                                // 13: target ID (hidden)
                                row.push(item.target.id);

                                // 14: target class
                                var trgc = otDictionary.NA;
                                if (otUtils.checkPath(item, 'target.target_class')) {
                                    trgc = item.target.target_class[0] || otDictionary.NA;
                                }
                                row.push(trgc);

                                // 15: evidence source
                                row.push('<a class=\'ot-external-link\' href=\'' +
                                    item.evidence.drug2clinic.urls[0].url +
                                    '\' target=\'_blank\'>' + item.evidence.drug2clinic.urls[0].nice_name + '</a>');

                                // 16: evidence URL (hidden)
                                row.push(decodeURI(item.evidence.drug2clinic.urls[0].url));

                                // 17-21: hidden cols for filtering
                                // these do not appear in the HTML and are not included in the download
                                row.push(item.disease.efo_info.label); // disease
                                row.push(item.drug.molecule_name); // drug
                                row.push(item.evidence.target2drug.mechanism_of_action); // mechanism
                                row.push(item.evidence.drug2clinic.urls[0].nice_name); // evidence source
                                row.push(item.target.gene_info.symbol); // target symbol

                                newdata.push(row); // use push() so we don't end up with empty rows


                                // parse data for summary viz
                                //
                                all_phases[item.evidence.drug2clinic.clinical_trial_phase.label] = all_phases[item.evidence.drug2clinic.clinical_trial_phase.label] || [];
                                all_phases[item.evidence.drug2clinic.clinical_trial_phase.label].push({
                                    // drug: item.drug.molecule_name,
                                    id: item.drug.max_phase_for_all_diseases.numeric_index,
                                    label: item.evidence.drug2clinic.clinical_trial_phase.label
                                });

                                type_activity[item.drug.molecule_type] = type_activity[item.drug.molecule_type] || {};
                                type_activity[item.drug.molecule_type][activity] = type_activity[item.drug.molecule_type][activity] || [];
                                // type_activity[item.drug.molecule_type][activity].push(activity);
                                type_activity[item.drug.molecule_type][activity].push(item.drug.molecule_name);
                                // type_activity[item.drug.molecule_type][activity].push({
                                //     activity: activity,
                                //     drug: item.drug.molecule_name
                                // });
                            } catch (e) {
                                scope.ext.hasError = true;
                            }
                        });

                        var all_drugs_sorted = _.sortBy(all_drugs, function (rec) {
                            return rec.id;
                        });

                        var showLim = 50;
                        scope.show = {};
                        scope.show.limit = showLim;
                        scope.show.ellipsis = '[Show more]';
                        scope.drugs = _.uniqBy(all_drugs_sorted, 'id');
                        scope.drugs.forEach(function (d) {
                            var chemblId = d.url.split('/').pop();
                            if (chemblId.indexOf('CHEMBL') > -1) {
                                d.url = '/summary?drug=' + chemblId;
                            }
                        });

                        scope.phases = Object.keys(all_phases).map(function (phase) {
                            return {
                                label: phase,
                                value: all_phases[phase].length,
                                // value: _.uniqBy(all_phases[phase], 'drug').length,
                                id: phase // all_phases[phase].length
                            };
                        });

                        scope.type_activity = Object.keys(type_activity).map(function (ta) {
                            return {
                                label: ta,
                                values: Object.keys(type_activity[ta]).map(function (act) {
                                    return {id: act, value: _.uniq(type_activity[ta][act]).length};
                                })
                            };
                        });

                        scope.associated_diseases = _.uniqBy(data, 'disease.efo_info.efo_id');
                        scope.associated_targets = _.uniqBy(data, 'target.id');


                        scope.show.moreOrLess = scope.drugs.length > showLim;

                        scope.showMoreOrLess = function () {
                            scope.show.moreOrLess = true;
                            if (scope.show.limit === scope.drugs.length) { // It is already open
                                scope.show.limit = showLim;
                                scope.show.ellipsis = '[Show more]';
                            } else {  // It is closed
                                scope.show.limit = scope.drugs.length;
                                scope.show.ellipsis = '[Show less]';
                            }
                        };

                        return newdata;
                    }

                    var dropdownColumns = [1, 3, 5, 6, 7, 8, 9, 11, 12, 14, 15];

                    /*
                     * This is the hardcoded data for the Known Drugs table and
                     * will obviously need to change and pull live data when available
                     */
                    function initTableDrugs () {
                        table = elem[0].getElementsByTagName('table');
                        dtable = $(table).dataTable(otUtils.setTableToolsParams({
                            'data': formatDrugsDataToArray(scope.ext.data),
                            'autoWidth': false,
                            'paging': true,
                            'order': [[5, 'desc']],
                            'columnDefs': [
                                // set column widths
                                {
                                    'targets': [0],    // the access-level (public/private icon)
                                    'width': '3%'
                                },
                                {
                                    'targets': [1, 3, 9],
                                    'width': '12%'
                                },
                                {
                                    'targets': [7, 8, 11, 14],
                                    'width': '10%'
                                },
                                {
                                    'targets': [5, 12, 15],
                                    'width': '7%'
                                },
                                // set columns visiblity and filters
                                // access-level
                                {
                                    'targets': [0],
                                    'visible': otConfig.show_access_level
                                },
                                // disease
                                {
                                    'targets': [1],
                                    'mRender': otColumnFilter.mRenderGenerator(17),
                                    'mData': otColumnFilter.mDataGenerator(1, 17)
                                },
                                {
                                    'targets': [2],
                                    'visible': false
                                },
                                // drug
                                {
                                    'targets': [3],
                                    'mRender': otColumnFilter.mRenderGenerator(18),
                                    'mData': otColumnFilter.mDataGenerator(3, 18)
                                },
                                // drug id
                                {
                                    'targets': [4],
                                    'visible': false
                                },
                                {
                                    'targets': [6],
                                    'visible': false
                                },
                                // mech of action
                                {
                                    'targets': [9],
                                    'mRender': otColumnFilter.mRenderGenerator(19),
                                    'mData': otColumnFilter.mDataGenerator(9, 19)
                                },
                                {
                                    'targets': [10],
                                    'visible': false
                                },
                                // target
                                {
                                    'targets': [12],
                                    'mRender': otColumnFilter.mRenderGenerator(21),
                                    'mData': otColumnFilter.mDataGenerator(12, 21)
                                },
                                // target ID
                                {
                                    'targets': [13],
                                    'visible': false
                                },
                                // evidence source
                                {
                                    'targets': [15],
                                    'mRender': otColumnFilter.mRenderGenerator(20),
                                    'mData': otColumnFilter.mDataGenerator(15, 20)
                                },
                                // evidence URL
                                {
                                    'targets': [16],
                                    'visible': false
                                }
                            ],
                            initComplete: otColumnFilter.initCompleteGenerator(dropdownColumns)
                        }, (scope.output ? scope.output + '-' : '') + 'known_drugs'));
                    }
                });
            }
        };
    }]);
