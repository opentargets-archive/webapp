/**
 * Safety risk information table
 *
 * Optional ext object params:
 *  isLoading, hasError, data
 */
angular.module('otDirectives')

    /* Directive to display the safety risk information table*/
    .directive('otSafetyRiskTable', ['otUtils', 'otUpperCaseFirstFilter', function (otUtils, otUpperCaseFirstFilter) {

        return {
            restrict: 'AE',

            templateUrl: 'src/components/safety-risk-table/safety-risk-table.html',

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

                /*
                 * Parse an array of 'effects' (e.g. agonism_activation_effects) into an html list.
                 * Specify the base url for links and whether the link is external.
                 */
                function parseArrayToList (arr, url, ext) {
                    var ul = '<ul>';
                    ul += arr.map(function (item) {
                        var content = otUpperCaseFirstFilter(item.term_in_paper);
                        return '<li>'
                                + content + '<span style="display:none">, </span>'
                                + '</li>';
                    }).join('');
                    ul += '</ul>';
                    return ul;
                }


                function formatDataToArray (data) {
                    var rows = data.map(function (mark) {
                        var row = [];

                        // main organs & systems affected
                        row.push(parseArrayToList(mark.organs_systems_affected, 'http://purl.obolibrary.org/obo/', true));

                        // safety liability information
                        row.push(mark.safety_liability);

                        // publications
                        row.push(
                            mark.references.map(function (ref) {
                                if (ref.pmid) {
                                    return '<a href="https://europepmc.org/abstract/MED/' + ref.pmid + '" target="_blank">' + ref.ref_label + '</a>';
                                } else {
                                    return '<a href="' + ref.ref_link + '" target="_blank">' + ref.ref_label + '</a>';
                                }
                            }).join(', ')
                        );

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
                                'targets': [0],
                                'width': '27%'
                            },
                            {
                                'targets': [1],
                                'width': '54%'
                            },
                            {
                                'targets': [2],
                                'width': '19%'
                            }
                        ]
                    }, scope.target.approved_symbol + '-safety-effect'));
                }
            }
        };
    }]);
