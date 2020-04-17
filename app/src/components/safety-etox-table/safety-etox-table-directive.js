/**
 * Non-clinical experimental toxicity table
 *
 * optional ext object params:
 *  isLoading, hasError, data
 */
angular.module('otDirectives')

    /* Directive to display the target non-clinical experimental toxicity table  */
    .directive('otSafetyEtoxTable', ['otUtils', 'otUpperCaseFirstFilter', 'otDictionary', function (otUtils, otUpperCaseFirstFilter, otDictionary) {
        return {
            restrict: 'AE',

            templateUrl: 'src/components/safety-etox-table/safety-etox-table.html',

            scope: {
                output: '@?',    // optional output for filename export
                ext: '=?',       // optional external object to pass things out of the directive; TODO: this should remove the need for all parameters above
                data: '=',
                target: '='
            },

            link: function (scope, elem, attrs) {
                scope.$watch('data', function (data) {
                    if (data) {
                        initTable();
                    }
                });

                function formatDataToArray (data) {
                    var rows = data.map(function (d) {
                        var row = [];

                        // Tissue
                        row.push(otUpperCaseFirstFilter(d.experiment_details.tissue || otDictionary.NA));

                        // Assay description
                        row.push(otUpperCaseFirstFilter(d.experiment_details.assay_description || otDictionary.NA));

                        // Assay format
                        row.push(otUpperCaseFirstFilter(d.experiment_details.assay_format || otDictionary.NA));

                        // Assay type
                        row.push(otUpperCaseFirstFilter(d.experiment_details.assay_format_type || otDictionary.NA));

                        // Source
                        row.push('<a href="' + d.data_source_reference_link + '">' + d.data_source + '</a>');

                        return row;
                    });
                    return rows;
                }


                function initTable () {
                    var table = elem[0].getElementsByTagName('table');
                    $(table).DataTable(otUtils.setTableToolsParams({
                        'data': formatDataToArray(scope.data),
                        'ordering': true,
                        'autoWidth': false,
                        'paging': true,
                        'columnDefs': [
                            {
                                'targets': [0, 2, 3, 4],
                                'width': '13%'
                            }
                        ]
                    }, scope.target.approved_symbol + '-safety-etox'));
                }
            }
        };
    }]);
