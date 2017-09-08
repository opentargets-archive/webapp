/* Evidence tables Directives */

angular.module('otDirectives')

    /* Directive to display the somatic mutation data table */
    .directive('otRnaExpressionTable', ['otApi', 'otConsts', 'otUtils', 'otConfig', '$location', 'otDictionary', '$log', function (otApi, otConsts, otUtils, otConfig, $location, otDictionary, $log) {
        'use strict';
        // var dbs = otConsts.dbs;
        var searchObj = otUtils.search.translateKeys($location.search());
        var checkPath = otUtils.checkPath;

        return {
            restrict: 'AE',

            templateUrl: 'src/components/rna-expression-table/rna-expression-table.html',

            scope: {
                loadFlag: '=?',    // optional load-flag: true when loading, false otherwise. links to a var to trigger spinners etc...
                data: '=?',        // optional data link to pass the data out of the directive
                title: '=?',       // optional title for filename export
                errorFlag: '=?'    // optional error-flag: pass a var to hold parsing-related errors
            },

            link: function (scope, elem, attrs) {
                scope.errorFlag = false;
                scope.$watchGroup([function () { return attrs.target; }, function () { return attrs.disease; }], function () {
                    if (attrs.target && attrs.disease) {
                        getData();
                    }
                });

                function getData () {
                    // scope.search.tables.rna_expression.is_loading = true;
                    scope.loadFlag = true;
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
                                    scope.data = resp.body.data;
                                    initTable();
                                } else {
                                    $log.warn('Empty response : RNA expression');
                                }
                            },
                            otApi.defaultErrorHandler
                        )
                        .finally(function () {
                            scope.loadFlag = false;
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
                            row.push((item.access_level !== otConsts.ACCESS_LEVEL_PUBLIC) ? otConsts.ACCESS_LEVEL_PUBLIC_DIR : otConsts.ACCESS_LEVEL_PRIVATE_DIR);

                            // disease
                            row.push(item.disease.efo_info.label);

                            // comparison
                            row.push(item.evidence.comparison_name);

                            // activity
                            var activityUrl = item.evidence.urls[0].url;
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
                            var expOverview = (item.evidence.urls[2] || item.evidence.urls[0]).url || otDictionary.NA;
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

                            newdata.push(row); // push, so we don't end up with empty rows
                        } catch (e) {
                            scope.errorFlag = true;
                            $log.log('Error parsing RNA-expression data:');
                            $log.log(e);
                        }
                    });

                    return newdata;
                }


                function initTable () {
                    var table = elem[0].getElementsByTagName('table');
                    $(table).DataTable(otUtils.setTableToolsParams({
                        'data': formatDataToArray(scope.data),
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
                                'targets': [9, 10],
                                'width': '12%'
                            },
                            {
                                'targets': [2, 5],
                                'width': '13%'
                            },
                            {
                                'targets': [3, 4],
                                'width': '10%'
                            }
                        ]
                    }, (scope.title ? scope.title + '-' : '') + '-RNA_expression'));
                }
            }
        };
    }]);
