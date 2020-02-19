/**
 * RNA expression table
 *
 * ext object params:
 *  isLoading, hasError, data
 */
angular.module('otDirectives')

    /* Directive to display the rna expression data table */
    .directive('otRnaExpressionTable', ['otColumnFilter', 'otApi', 'otConsts', 'otUtils', 'otConfig', '$location', 'otDictionary', '$log', function (otColumnFilter, otApi, otConsts, otUtils, otConfig, $location, otDictionary, $log) {
        'use strict';
        // var dbs = otConsts.dbs;
        var searchObj = otUtils.search.translateKeys($location.search());
        var checkPath = otUtils.checkPath;

        return {
            restrict: 'AE',

            templateUrl: 'src/components/rna-expression-table/rna-expression-table.html',

            scope: {
                output: '@?',    // optional output for filename export
                ext: '=?'       // optional external object to pass things out of the directive; TODO: this should remove teh need for all parameters above
            },

            link: function (scope, elem, attrs) {
                scope.otDictionary = otDictionary;
                scope.ext.hasError = false;
                scope.$watchGroup([function () { return attrs.target; }, function () { return attrs.disease; }], function () {
                    if (attrs.target && attrs.disease) {
                        getData();
                    }
                });

                function getData () {
                    // scope.search.tables.rna_expression.is_loading = true;
                    scope.ext.isLoading = true;
                    var opts = {
                        size: 1000,
                        datasource: otConfig.evidence_sources.rna_expression, // scope.search.tables.rna_expression.source,
                        fields: [
                            'disease',
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
                                    initTable();
                                } else {
                                    $log.warn('Empty response : RNA expression');
                                }
                            },
                            otApi.defaultErrorHandler
                        )
                        .finally(function () {
                            scope.ext.isLoading = false;
                        });
                }


                /*
                 * Takes the data object returned by the API and formats it to an array of arrays
                 * to be displayed by the RNA-expression dataTable widget.
                 */
                function formatDataToArray (data) {
                    var newdata = [];
                    data.forEach(function (item) {
                        // create rows:
                        var row = [];

                        try {
                            // col 0: data origin: public / private
                            row.push((item.access_level === otConsts.ACCESS_LEVEL_PUBLIC) ? otConsts.ACCESS_LEVEL_PUBLIC_DIR : otConsts.ACCESS_LEVEL_PRIVATE_DIR);

                            // disease
                            row.push(item.disease.efo_info.label);

                            // comparison
                            row.push(item.evidence.comparison_name);

                            // activity
                            var activityUrl = item.evidence.urls.filter(function (i) { return i.nice_name === 'Gene expression in Expression Atlas'; })[0].url || '';
                            var activity = item.target.activity.split('_').shift();
                            row.push('<a class=\'ot-external-link\' href=\'' + activityUrl + '\' target=\'_blank\'>' + activity + '</a>');

                            // tissue / cell
                            row.push(item.disease.biosample.name);

                            // evidence source
                            row.push(otUtils.getEcoLabel(item.evidence.evidence_codes_info, item.evidence.evidence_codes[0]));

                            // fold change
                            row.push(item.evidence.log2_fold_change.value);

                            // p-value
                            row.push((item.evidence.resource_score.value).toExponential(2));

                            // percentile rank
                            row.push(item.evidence.log2_fold_change.percentile_rank);

                            // experiment overview
                            var expID = (item.evidence.urls.filter(function (i) { return i.nice_name === 'ArrayExpress Experiment overview'; })[0].url || '').split('/').pop();
                            var expOverview = 'https://www.ebi.ac.uk/gxa/experiments/' + expID + '/Experiment%20Design';
                            row.push('<a class=\'ot-external-link\' href=\'' + expOverview + '\' target=\'_blank\'>' + (item.evidence.experiment_overview || 'Experiment overview and raw data') + '</a>');


                            // publications
                            var refs = [];
                            if (checkPath(item, 'evidence.provenance_type.literature.references')) {
                                refs = item.evidence.provenance_type.literature.references;
                            }
                            var pmidsList = otUtils.getPmidsList(refs);
                            row.push(otUtils.getPublicationsString(pmidsList));

                            // Publication ids (hidden)
                            row.push(pmidsList.join(', '));

                            // hidden columns for filtering
                            row.push(activity); // activity
                            row.push(item.evidence.experiment_overview || 'Experiment overview and raw data'); // experiment overview + data

                            newdata.push(row); // push, so we don't end up with empty rows
                        } catch (e) {
                            scope.ext.hasError = true;
                            $log.log('Error parsing RNA-expression data:');
                            $log.log(e);
                        }
                    });

                    return newdata;
                }

                var dropdownColumns = [1, 2, 3, 4, 5, 9];

                function initTable () {
                    var table = elem[0].getElementsByTagName('table');
                    $(table).DataTable(otUtils.setTableToolsParams({
                        'data': formatDataToArray(scope.ext.data),
                        'order': [[1, 'asc']],
                        'autoWidth': false,
                        'paging': true,
                        'columnDefs': [
                            {
                                'targets': [0],    // the access-level (public/private icon)
                                'visible': otConfig.show_access_level,
                                'width': '3%'
                            },
                            {
                                'targets': [11],
                                'visible': false
                            },
                            {
                                'targets': [6, 7, 8],
                                'width': '6%'
                            },
                            {
                                'targets': [10],
                                'width': '12%'
                            },
                            {
                                'targets': [2, 5],
                                'width': '13%'
                            },
                            {
                                'targets': [4],
                                'width': '10%'
                            },
                            {
                                'targets': [3],
                                'width': '10%',
                                'mRender': otColumnFilter.mRenderGenerator(12),
                                'mData': otColumnFilter.mDataGenerator(3, 12)
                            },
                            {
                                'targets': [9],
                                'width': '12%',
                                'mRender': otColumnFilter.mRenderGenerator(13),
                                'mData': otColumnFilter.mDataGenerator(9, 13)
                            }
                        ],
                        initComplete: otColumnFilter.initCompleteGenerator(dropdownColumns)
                    }, (scope.output ? scope.output + '-' : '') + '-RNA_expression'));
                }
            }
        };
    }]);
