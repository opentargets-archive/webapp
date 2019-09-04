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
                var downloadCols = [
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


                function getData (nextIndex) {
                    var opts = {
                        size: 10000
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
                    return otApi.getKnownDrug(queryObject);
                }


                function getDrugData () {
                    scope.ext.isLoading = true;
                    getData()
                        .then(
                            function (resp) {
                                if (resp.body) {
                                    scope.ext.rawdata = resp.body;
                                    scope.ext.data = scope.ext.rawdata.data;
                                    scope.ext.total = resp.body.data.length; // TODO: we need a TOTAL in the response
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

                function getTableStats (stats) {
                    return {
                        summary: {
                            unique_drugs: stats.unique_drugs,
                            associated_targets: stats.associated_targets,
                            associated_diseases: stats.associated_diseases
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

                function createDownload (alldata, format) {
                    // format: csv, tsv, json
                    format = format.toLowerCase();
                    if (format !== 'csv' && format !== 'tsv' && format !== 'json') {
                        // only support the above formats
                        return;
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
                            return formatDataToRow(item, false)
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
                        data = downloadCols.join(separator) + '\n' + data;
                        blob = new Blob([data], {type: type});
                    }

                    saveAs(blob, (scope.output ? scope.output + '-' : '') + 'known_drugs-all' + fe);
                }


                scope.downloadAllData = function (format) {
                    scope.ext.isDownloading = true;
                    var alldata = [];
                    // otGoogleAnalytics.trackEvent('alldrugs', 'download', 'CSV');
                    function callNext (nextIndex) {
                        getData(nextIndex)
                            .then(
                                function (resp) {
                                    alldata = alldata.concat(resp.body.data);
                                    if (resp.body.next) {
                                        return callNext(resp.body.next);
                                    } else {
                                        createDownload(alldata, format);
                                        scope.ext.isDownloading = false;
                                    }
                                }
                            );
                    }

                    callNext();
                };

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
                    // console.log('fD2R ', item);
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
                        row.push(
                            // item.urls
                            // item.urls.map(function (url) {
                            //     return decodeURI(url.url);
                            // }).join(', ')
                            item.urls.reduce(function (acc, i) {
                                var source = acc.filter(function (el) { return el.nice_name === i.nice_name; })[0]
                                    || {urls: [], nice_name: i.nice_name};
                                if (!source.urls.length) {
                                    acc.push(source);
                                }
                                source.urls.push(i.url);
                                return acc;
                            }, [])
                        );

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
                        // **TODO**: we no longer have literature.references or target2drugs.urls[2]
                        // so this block no longer applies
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
                        row.push('**TODO**');

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

                /*
                * This is the hardcoded data for the Known Drugs table and
                * will obviously need to change and pull live data when available
                */
                function initTableDrugs () {
                    var filename = (scope.output ? scope.output + '-' : '') + 'known_drugs';
                    table = elem[0].getElementsByTagName('table');
                    dtable = $(table).dataTable(otUtils.setTableToolsParams({
                        'data': formatDrugsDataToArray(scope.ext.data),
                        'autoWidth': false,
                        'paging': true,
                        'order': [[5, 'desc']],
                        'buttons': [
                            {
                                extend: 'csv',
                                text: '<span title="Download as .csv"><span class="fa fa-download"></span> Download .csv</span>',
                                title: filename
                            },
                            {
                                extend: 'csv',
                                text: '<span title="Download as .csv"><span class="fa fa-download"></span> Download .tsv</span>',
                                title: filename,
                                fieldSeparator: '\t',
                                extension: '.tsv'
                            },
                            {
                                text: '<span title="Download as .csv"><span class="fa fa-download"></span> Download .json</span>',
                                title: filename,
                                extension: '.json',
                                action: function () {
                                    var data = {data: scope.ext.rawdata.data};
                                    var b = new Blob([JSON.stringify(data)], {type: 'text/json;charset=utf-8'});
                                    saveAs(b, filename + '.json');
                                }
                            }
                        ],
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
                    return '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">' +
                        d[7].map(function (source) {
                            return '<tr>' +
                            '<td style="width:25%">' + source.nice_name + '</td>' +
                            '<td>' + source.urls.map(function (u) {
                                var url = u;
                                if (source.nice_name === 'Clinical Trials Information') {
                                    url = '<a href="' + url + '" target="_blank">' + (url.split('%22')[1]) + '</a>';
                                }
                                return url;
                            }).join(', ') + '</td>' +
                            '</tr>';
                        }).join() +
                    '</table>';
                }
                function clickHandler (e) {
                    var tr = $(e.target).closest('tr');
                    var row = dtable.api().row(tr);

                    if (row.child.isShown()) {
                        // This row is already open - close it
                        row.child.hide();
                        tr.removeClass('shown');
                    }
                    else {
                        // Open this row
                        row.child(formatDetails(row.data())).show();
                        tr.addClass('shown');
                    }
                }
            }
        };
    }]);
