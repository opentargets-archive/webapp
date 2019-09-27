/**
 * CRISPR table
 *
 * ext object params:
 *  isLoading, hasError, data
 */
angular.module('otDirectives')

    /*
     * Directive to display the CRISPR data table
     */
    .directive('otCrisprTable', ['otApi', 'otConsts', 'otUtils', 'otConfig', '$location', 'otDictionary', '$log', function (otApi, otConsts, otUtils, otConfig, $location, otDictionary, $log) {
        'use strict';
        var searchObj = otUtils.search.translateKeys($location.search());
        var moreHtml = '&hellip;&nbsp;[&nbsp;show&nbsp;more&nbsp;]';
        var lessHtml = '&nbsp;[&nbsp;show&nbsp;less&nbsp;]';

        return {
            restrict: 'AE',

            templateUrl: 'src/components/crispr-table/crispr-table.html',

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
                    scope.ext.isLoading = true;
                    var opts = {
                        size: 1000,
                        datasource: otConfig.evidence_sources.pathway.crispr,
                        fields: [
                            'access_level',
                            'disease.name', 'disease.id',
                            'scores',
                            'evidence.resource_score.method'
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
                                    $log.warn('Empty response : pathway crispr');
                                }
                            },
                            otApi.defaultErrorHandler
                        )
                        .finally(function () {
                            scope.ext.isLoading = false;
                        });
                }


                /*
                 * Takes the data object returned by the API and formats it
                 * to an array of arrays to be displayed by the dataTable widget.
                 */
                function formatDataToArray (data) {
                    var newdata = [];

                    data.forEach(function (item) {
                        // create rows:
                        var row = [];

                        try {
                            // col 0: data origin: public / private
                            row.push((item.access_level === otConsts.ACCESS_LEVEL_PUBLIC) ? otConsts.ACCESS_LEVEL_PUBLIC_DIR : otConsts.ACCESS_LEVEL_PRIVATE_DIR);

                            // 1,2: disease
                            row.push(item.disease.name);
                            row.push(item.disease.id);

                            // 3: score
                            row.push(item.scores.association_score);

                            // 4: method
                            row.push(item.evidence.resource_score.method.description);

                            // 5,6: pmid
                            row.push(item.evidence.resource_score.method.reference);
                            row.push(item.evidence.resource_score.method.reference); // hidden column, used for downloads info

                            newdata.push(row);
                        } catch (e) {
                            scope.ext.hasError = true;
                            $log.error('Error parsing pathways data:');
                            $log.error(e);
                        }
                    });
                    return newdata;
                }

                // var dropdownColumns = [1, 2, 3, 4, 5];

                function initTable () {
                    var table = elem[0].getElementsByTagName('table');
                    var t = $(table).DataTable(otUtils.setTableToolsParams({
                        'data': formatDataToArray(scope.ext.data),
                        'ordering': true,
                        'order': [[3, 'desc']],
                        'autoWidth': false,
                        'paging': true,
                        'columnDefs': [
                            {
                                'targets': [0],    // the access-level (public/private icon)
                                'visible': otConfig.show_access_level,
                                'width': '3%'
                            },
                            {
                                'targets': [2, 6],
                                'visible': false
                            },
                            {
                                'targets': [3, 5],
                                'width': '15%'
                            },
                            {
                                'targets': [1],
                                'width': '20%',
                                'render': function (data, type, row) {
                                    return '<a href="/disease/' + row[2] + '">' + data + '</a>';
                                }
                            },
                            {
                                'targets': [4],
                                // 'width': '48%',
                                'render': function (data, type, row) {
                                    var text = data;
                                    var limit = 260;
                                    if (data.length > limit) {
                                        text = '<span>' + data.substring(0, limit) + '</span><span class="sysbio-method-more-text hidden">' + data.substring(limit) + '</span><span class="sysbio-method-more-btn">' + moreHtml + '</span>';
                                    }
                                    return '<span class="sysbio-method">' + text + '</span>';
                                }
                            },
                            {
                                'targets': [5],
                                'render': function (data, type, row) {
                                    return '<a href="' + data + '" target="_blank"><span class="ot-publications-string"><span class="badge">1</span> publication</span></a>';
                                }
                            }
                        ]
                    }, (scope.output ? scope.output + '-' : '') + '-systems_biology'));

                    return t;
                }
            }
        };
    }]);
