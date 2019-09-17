/**
 * Drugs table
 *
 * ext object params:
 *  isLoading, hasError, data
 */
angular.module('otDirectives')

    /* Directive to display the known drug evidence table */
    .directive('otKnownDrugTableAgg', ['otColumnFilter', 'otApi', 'otConsts', 'otUtils', 'otConfig', '$location', 'otDictionary', function (otColumnFilter, otApi, otConsts, otUtils, otConfig, $location, otDictionary) {
        'use strict';
        // var dbs = otConsts.dbs;
        var searchObj = otUtils.search.translateKeys($location.search());
        var checkPath = otUtils.checkPath;

        return {
            restrict: 'AE',
            templateUrl: 'src/components/known-drug-table/known-drug-table-agg.html',
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
                // Column names for table download.
                // Currently not used: commenting out until next revision
                // var downloadCols = [
                //     'Access',
                //     'Disease',
                //     'Disease ID',

                //     'Phase',
                //     'Phase (Numeric)',
                //     'Status',
                //     'Source',
                //     'Source URL',

                //     'Drug',
                //     'Drug ID',
                //     'Type',
                //     'Mechanism of action',
                //     'Mechanism of action references',
                //     'Activity',

                //     'Target',
                //     'Target ID',
                //     'Target class'
                // ];

                // Column names for full download (i.e. evidence columns)
                var fullDownloadCols = [
                    'Access',
                    'Disease',
                    'Disease ID',
                    'Drug',
                    'Drug ID',
                    'Phase',
                    'Phase (Numeric)',
                    'Status',
                    'Type',
                    'Mechanism of action',
                    'Mechanism of action references',
                    'Activity',
                    'Target',
                    'Target ID',
                    'Target class',
                    'Evidence curated from',
                    'Evidence URL'
                ];

                var table, dtable;

                scope.ext.hasError = false;
                scope.output = scope.output || scope.title || ((scope.targetLabel || '') + (scope.targetLabel && scope.diseaseLabel ? '-' : '') + (scope.diseaseLabel || ''));

                scope.$watchGroup([function () { return attrs.target; }, function () { return attrs.disease; }], function () {
                    // Wa want to get data when we have both target and disease
                    // so it should return here if one or the other are undefined
                    if (!attrs.target && !attrs.disease) {
                        return;
                    }

                    getDrugData();
                });


                // =================================================
                //  D R U G S
                // =================================================


                /**
                 * Get 'expanded' drug data from the evidence endpoint.
                 * This is used for download only: note the fields are actually
                 * different than those use for table display.
                 *
                 * @param {*} nextIndex returned by the API, used for pagination
                 */
                function getExpandedData (nextIndex) {
                    var opts = {
                        size: 10000,
                        datasource: otConfig.evidence_sources.known_drug,
                        fields: [
                            'access_level',
                            'disease.efo_info',
                            'drug.id',
                            'drug.molecule_name',
                            'drug.molecule_type',
                            'evidence.drug2clinic.clinical_trial_phase.numeric_index',
                            'evidence.target2drug.urls',
                            'evidence.target2drug.provenance_type.database.id',
                            'evidence.target2drug.provenance_type.literature.references',
                            'evidence.target2drug.mechanism_of_action',
                            'evidence.drug2clinic.clinical_trial_phase',
                            'evidence.drug2clinic.status',
                            'evidence.drug2clinic.urls',
                            'target.activity',
                            'target.gene_info',
                            'target.target_class'
                        ]
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
                        method: 'GET',
                        params: opts
                    };
                    return otApi.getFilterBy(queryObject);
                }


                /*
                 * Get aggregated drug data and initilize drug accordingly.
                 * This is called when the directive loads the first time.
                 */
                function getDrugData () {
                    scope.ext.isLoading = true;
                    var opts = {
                        size: 10000
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
                    otApi.getKnownDrug(queryObject)
                        .then(
                            function (resp) {
                                if (resp.body) {
                                    scope.ext.rawdata = resp.body;
                                    scope.ext.data = scope.ext.rawdata.data;
                                    scope.ext.total = resp.body.data.length; // TODO: need TOTAL in the response
                                    scope.ext.size = resp.body.data.length;
                                    scope.stats = getTableStats(resp.body.facets);
                                    initTableDrugs();
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


                /**
                 * Parse the stats returned by the API
                 *
                 * @param {*} stats the 'facets' object in the API response
                 */
                function getTableStats (stats) {
                    return {
                        summary: {
                            drugs: stats.unique_drugs,
                            targets: stats.associated_targets,
                            diseases: stats.associated_diseases
                        },
                        phases: Object.keys(stats.clinical_trials)
                            .sort(function (a, b) { return b > a ? 1 : -1; })
                            .map(function (phase) {
                                return {
                                    label: phase,
                                    value: stats.clinical_trials[phase],
                                    id: phase
                                };
                            }),
                        type_activity: Object.keys(stats.drug_type_activity)
                            .sort()
                            .map(function (ta) {
                                return {
                                    label: ta,
                                    values: Object.keys(stats.drug_type_activity[ta])
                                        .map(function (act) {
                                            return {
                                                id: act,
                                                value: stats.drug_type_activity[ta][act]
                                            };
                                        })
                                };
                            })
                    };
                }


                /**
                 * Make and download a file for the given data in the specified format.
                 * Note: at the moment this will not work with the aggregated table data.
                 * It expects 'expanded' evidence data and will format the output accordingly.
                 *
                 * @param {Array} alldata data array
                 * @param {String} format 'csv', 'tsv' or 'json'
                 * @param {Boolean} full is this a download of all the data? for file naming purpose
                 */
                function createDownload (alldata, format, full) {
                    // format: csv, tsv, json
                    format = format.toLowerCase();
                    if (format !== 'csv' && format !== 'tsv' && format !== 'json') {
                        // only support the above formats
                        return;
                    }

                    // is it a full download of all data or just the table?
                    if (full === undefined) {
                        full = alldata.length > scope.ext.data;
                    }

                    var fe = '.' + format;  // file extension
                    var blob;
                    if (format === 'json') {
                        // setup download in JSON format, consistent with datatables one
                        var jd = {
                            data: alldata
                        };
                        blob = new Blob([JSON.stringify(jd)], {type: 'text/json;charset=utf-8'});
                    } else {
                        // setup download in CSV or TSV
                        var type = 'text/' + format + ';charset=utf-8';
                        var separator = (format === 'csv') ? ',' : '\t';
                        var data = alldata.map(function (item) {
                            return formatExpandedDataToRow(item)
                                .map(function (i) {
                                    // enclose cells quotation marks for CSV only
                                    var cell = (format === 'csv')
                                        ? '"' + i .toString().replace(/"/g, '""') + '"'
                                        : i;
                                    return cell;
                                })
                                .join(separator);
                        }).join('\n');
                        // add column headers
                        data = fullDownloadCols.join(separator) + '\n' + data;
                        blob = new Blob([data], {type: type});
                    }

                    saveAs(blob, (scope.output ? scope.output + '-' : '') + 'known_drugs' + (full ? '-all' : '') + fe);
                }


                /**
                 * Fetch data in the specified format and download it to file.
                 * Note: this downloads 'expanded' evidence data, which is in a slightly
                 * different format / columns order than what is displayed in the table.
                 *
                 * @param {String} format 'csv', 'tsv' or 'json'
                 */
                scope.downloadAllData = function (format) {
                    scope.ext.isDownloading = true;
                    var alldata = [];
                    function callNext (nextIndex) {
                        getExpandedData(nextIndex)
                            .then(
                                function (resp) {
                                    alldata = alldata.concat(resp.body.data);
                                    if (resp.body.next) {
                                        return callNext(resp.body.next);
                                    } else {
                                        createDownload(alldata, format, true);
                                        scope.ext.isDownloading = false;
                                    }
                                }
                            );
                    }

                    callNext();
                };


                /**
                 * Format expanded data (i.e. not aggregated).
                 * This is currently for download only.
                 * Returns a 'row' array.
                 *
                 * @param {Object} item a row of data
                 */
                function formatExpandedDataToRow (item) {
                    var row = [];
                    var cell = '';

                    try {
                        // 0: data origin: public / private
                        row.push(item.access_level);

                        // 1: disease name
                        row.push(item.disease.efo_info.label);

                        // 2: disease id (hidden)
                        row.push(item.disease.efo_info.efo_id.split('/').pop());

                        // 3: drug
                        row.push(item.drug.molecule_name);

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
                        row.push(item.evidence.target2drug.mechanism_of_action);

                        // 10: Mechanism of action references (hidden)
                        row.push(item.evidence.target2drug.urls.map(function (t2d) {
                            return t2d.nice_name + ': ' + t2d.url;
                        }).join(', '));

                        // 11: Activity
                        cell = item.target.activity;
                        switch (cell) {
                        case 'drug_positive_modulator' :
                            cell = 'agonist';
                            break;
                        case 'drug_negative_modulator' :
                            cell = 'antagonist';
                            break;
                        }
                        row.push(cell);

                        // 12: target
                        row.push(item.target.gene_info.symbol);

                        // 13: target ID (hidden)
                        row.push(item.target.gene_info.geneid);

                        // 14: target class
                        var trgc = otDictionary.NA;
                        if (otUtils.checkPath(item, 'target.target_class')) {
                            trgc = item.target.target_class[0] || otDictionary.NA;
                        }
                        row.push(trgc);

                        // 15: evidence source
                        row.push(item.evidence.drug2clinic.urls[0].nice_name);

                        // 16: evidence URL (hidden)
                        row.push(decodeURI(item.evidence.drug2clinic.urls[0].url));

                        return row;
                    } catch (e) {
                        scope.ext.hasError = true;
                        return [];
                    }
                }


                /**
                 * Format aggregated data for display in table. Returns a 'row' array.
                 *
                 * @param {Object} item a row of data
                 * @param {Boolean} asHtml format the data for display (html) rather than download
                 */
                function formatDataToRow (item, asHtml) {
                    /*
                    0 (0)   : access

                    // Disease info
                    1 (1)   : Disease
                    2       : Disease ID  (hidden)

                    // Clinical trial info
                    3 (2)   : Phase
                    4       : Phase Numeric (hidden)
                    5 (3)   : Status
                    6 (4)   : Source
                    7       : Source URL (hidden)

                    // Drug information
                    8 (5)   : Drug
                    9       : Drug ID (hidden)
                    10 (6)  : Type
                    11 (7)  : Mechanism of action
                    12      : Mechanism of action references (hidden)
                    13 (8)  : Activity

                    // Target information
                    14 (9)  : Target
                    15      : Target ID (hidden)
                    16 (10) : Target class
                    */
                    var row = [];
                    var cell = '';

                    try {
                        // 0: data origin: public / private
                        cell = 'public'; // TODO: need a field for this
                        if (asHtml) {
                            cell = (item.access_level === otConsts.ACCESS_LEVEL_PUBLIC) ? otConsts.ACCESS_LEVEL_PUBLIC_DIR : otConsts.ACCESS_LEVEL_PRIVATE_DIR;
                        }
                        row.push(cell);

                        // 1: disease name
                        cell = item.disease_name;
                        if (asHtml) {
                            cell = '<a href=\'/disease/' + item.disease_id + '\'>' + cell + '</a>';
                        }
                        row.push(cell);

                        // 2: disease id (hidden)
                        row.push(item.disease_id);

                        // 3: phase
                        row.push(item.clinical_trial_phase_label);

                        // 4: phase numeric (hidden)
                        row.push(item.clinical_trial_phase_number);

                        // 5: status
                        row.push(item.status || otDictionary.NA);

                        // 6: source
                        cell = item.count + ' record' + (item.count === 1 ? '' : 's'); // same as item.urls.length
                        if (asHtml) {
                            cell += '&nbsp;<span class="fa fa-plus-circle"></span>';
                        }
                        row.push(cell);

                        // 7: source URL (hidden)
                        // item.urls
                        // item.urls.map(function (url) {
                        //     return decodeURI(url.url);
                        // }).join(', ')
                        cell = item.urls.reduce(function (acc, i) {
                            var source = acc.filter(function (el) { return el.nice_name === i.nice_name; })[0]
                                || {urls: [], nice_name: i.nice_name};
                            if (!source.urls.length) {
                                acc.push(source);
                            }
                            source.urls.push(i.url);
                            return acc;
                        }, []);

                        if (!asHtml) {
                            // in case of downloads, format the data nicely but simply
                            cell = cell.map(function (i) {
                                return i.nice_name + ': ' + i.urls.join(', ');
                            }).join('; ');
                        }
                        row.push(cell);

                        // 8: drug
                        cell = item.drug_label;
                        if (asHtml) {
                            var link = item.drug_id;
                            var linkClass = 'class="ot-external-link"';
                            var target = 'target=_blank';
                            if (item.drug_id.toLowerCase().indexOf('chembl') !== -1) {
                                link = '/summary?drug=' + item.drug_id.split('/').pop();
                                linkClass = '';
                                target = '';
                            }
                            cell = '<a ' + linkClass + ' href=\'' + link + '\' ' + target + '>' + cell + '</a>';
                        }
                        row.push(cell);

                        // 9: drug id
                        row.push(item.drug_id.split('/').pop());

                        // 10: type
                        row.push(item.drug_type);

                        // 11: Mechanism of action + publications
                        cell = item.mechanisms_of_action.join(asHtml ? '<br />' : ', ');
                        // TODO:
                        // we no longer have literature.references or target2drugs.urls[2]
                        // so this block no longer applies.
                        // Remove unless references are added to API response / data
                        // if (asHtml) {
                        //     var refs = [];
                        //     if (checkPath(item, 'evidence.target2drug.provenance_type.literature.references')) {
                        //         refs = item.evidence.target2drug.provenance_type.literature.references;
                        //     }

                        //     if (refs.length > 0) {
                        //         cell += '<br />' + otUtils.getPublicationsString(otUtils.getPmidsList(refs));
                        //     }

                        //     if (item.evidence.target2drug.urls && item.evidence.target2drug.urls[2]) {
                        //         var extLink = item.evidence.target2drug.urls[2];
                        //         cell += '<br /><span><a class=\'ot-external-link\' target=_blank href=' + extLink.url + '>' + extLink.nice_name  + '</a></span>';
                        //     }
                        // }
                        row.push(cell);

                        // 10: Mechanism of action references (hidden)
                        // row.push(item.evidence.target2drug.urls.map(function (t2d) {
                        //     return t2d.nice_name + ': ' + t2d.url;
                        // }).join(', '));
                        // TODO: this column is currently hidden. The display data
                        // is NOT used for download purposes. So this is NOT visible to the user.
                        row.push('N/A');

                        // 11: Activity
                        cell = item.target_activity;
                        switch (cell) {
                        case 'drug_positive_modulator' :
                            cell = 'agonist';
                            break;
                        case 'drug_negative_modulator' :
                            cell = 'antagonist';
                            break;
                        }
                        row.push(cell);

                        // 12: target
                        cell = item.target_symbol;
                        if (asHtml) {
                            cell = '<a href=\'/target/' + item.target_id + '\'>' + cell + '</a>';
                        }
                        row.push(cell);

                        // 13: target ID (hidden)
                        row.push(item.target_id);

                        // 14: target class
                        var trgc = otDictionary.NA;
                        if (item.target_classes) {
                            trgc = item.target_classes.join(', ');
                        }
                        row.push(trgc);

                        return row;
                    } catch (e) {
                        scope.ext.hasError = true;
                        return [];
                    }
                }


                /**
                 * Format aggregated drugs data for table display.
                 * @param {Array} data the data array from API response
                 */
                function formatDrugsDataToArray (data) {
                    var newdata = [];

                    data.forEach(function (item) {
                        var row = [];

                        try {
                            row = formatDataToRow(item, true);
                            // 17-21: hidden cols for filtering
                            // these do not appear in the HTML and are not included in the download
                            row.push(item.disease_name); // 17: disease
                            row.push(item.drug_label); // 18: drug
                            row.push(item.mechanisms_of_action[0]); // 19: mechanism
                            row.push(item.target_symbol); // 20: target symbol
                            row.push(item.count + ' record' + (item.count === 1 ? '' : 's')); // 21: source
                            newdata.push(row);
                        } catch (e) {
                            scope.ext.hasError = true;
                        }
                    });

                    return newdata;
                }

                var dropdownColumns = [1, 3, 5, 6, 8, 10, 11, 13, 14, 16];


                function initTableDrugs () {
                    var filename = (scope.output ? scope.output + '-' : '') + 'known_drugs';
                    table = elem[0].getElementsByTagName('table');
                    dtable = $(table).dataTable(otUtils.setTableToolsParams({
                        'data': formatDrugsDataToArray(scope.ext.data),
                        'autoWidth': false,
                        'paging': true,
                        'order': [[5, 'desc']],
                        'buttons': [],
                        /*
                        0 (0)   : access

                        // Disease info
                        1 (1)   : Disease
                        2       : Disease ID  (hidden)

                        // Clinical trial info
                        3 (2)   : Phase
                        4       : Phase Numeric (hidden)
                        5 (3)   : Status
                        6 (4)   : Source
                        7       : Source URL (hidden)

                        // Drug information
                        8 (5)   : Drug
                        9       : Drug ID (hidden)
                        10 (6)  : Type
                        11 (7)  : Mechanism of action
                        12      : Mechanism of action references (hidden)
                        13 (8)  : Activity

                        // Target information
                        14 (9)  : Target
                        15      : Target ID (hidden)
                        16 (10) : Target class
                        */
                        'columnDefs': [
                            // set column widths
                            {
                                'targets': [0],    // the access-level (public/private icon)
                                'width': '3%'
                            },
                            // clinical trial
                            {
                                'targets': [3, 5, 6],
                                'width': '8%'
                            },
                            // target
                            {
                                'targets': [14],
                                'width': '8%'
                            },
                            {
                                'targets': [16],
                                'width': '12%'
                            },
                            // drug info
                            {
                                'targets': [8, 11],
                                'width': '12%'
                            },
                            {
                                'targets': [10, 13],
                                'width': '8%'
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
                            // phase numeric
                            {
                                'targets': [4],
                                'visible': false
                            },
                            // source
                            {
                                'targets': [6],
                                'className': 'details-control',
                                'mRender': otColumnFilter.mRenderGenerator(21),
                                'mData': otColumnFilter.mDataGenerator(6, 21)
                            },
                            // source URL
                            {
                                'targets': [7],
                                'visible': false
                            },
                            // drug
                            {
                                'targets': [8],
                                'mRender': otColumnFilter.mRenderGenerator(18),
                                'mData': otColumnFilter.mDataGenerator(8, 18)
                            },
                            // drug id
                            {
                                'targets': [9],
                                'visible': false
                            },
                            // mech of action
                            {
                                'targets': [11],
                                'mRender': otColumnFilter.mRenderGenerator(19),
                                'mData': otColumnFilter.mDataGenerator(11, 19)
                            },
                            {
                                'targets': [12],
                                'visible': false
                            },
                            // target
                            {
                                'targets': [14],
                                'mRender': otColumnFilter.mRenderGenerator(20),
                                'mData': otColumnFilter.mDataGenerator(14, 20)
                            },
                            // target ID
                            {
                                'targets': [15],
                                'visible': false
                            }
                        ],
                        initComplete: otColumnFilter.initCompleteGenerator(dropdownColumns)
                    }, filename));
                    dtable.on('click', 'td.details-control', clickHandler);
                    return dtable;
                }


                function formatDetails (d) {
                    return '<table cellpadding="5" cellspacing="0" border="0" style="width:100%">' +
                        d[7].map(function (source) {
                            return '<tr style="vertical-align:top">' +
                            '<td style="width:20%">' + source.nice_name + '</td>' +
                            '<td style="width:80%">' + source.urls.map(function (u) {
                                return '<a href="' + u + '" target="_blank">' + source.nice_name + '</a>';
                            }).join(', ') + '</td>' +
                            '</tr>';
                        }).join('') +
                    '</table>';
                }


                function clickHandler (e) {
                    var tr = $(e.target).closest('tr');
                    var row = dtable.api().row(tr);

                    if (row.child.isShown()) {
                        // This row is already open - close it
                        row.child.hide();
                        tr.removeClass('shown');
                    } else {
                        // Open this row
                        row.child(formatDetails(row.data())).show();
                        tr.addClass('shown');
                    }
                }
            }
        };
    }]);
