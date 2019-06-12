/**
 * Known safety effects table
 *
 * optional ext object params:
 *  isLoading, hasError, data
 */
angular.module('otDirectives')

    /* Directive to display the target known safety effects table  */
    .directive('otSafetyEffectTable', ['otUtils', 'otClearUnderscoresFilter', 'otUpperCaseFirstFilter', function (otUtils, otClearUnderscoresFilter, otUpperCaseFirstFilter) {

        return {
            restrict: 'AE',

            templateUrl: 'src/components/safety-effect-table/safety-effect-table.html',

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


                /*
                 * Takes an object like antagonism_inhibition_effects or agonism_activation_effects
                 * and returns the html to insert in the table cell.
                 */
                function parseEffectsDataToHtml (data) {
                    var effects = '';
                    if (Object.keys(data).length === 0) {
                        effects = 'No data available for this publication';
                    } else {
                        for (var i in data) {
                            effects += '<h6>' + otUpperCaseFirstFilter(otClearUnderscoresFilter(i)) + '<span style="display:none">: </span></h6>';
                            effects += parseArrayToList(data[i], '/disease/');
                        }
                    }
                    return effects;
                }


                function formatDataToArray (data) {
                    var rows = data.map(function (mark) {
                        var row = [];

                        // Main organs & systems affected
                        row.push(parseArrayToList(mark.organs_systems_affected, 'http://purl.obolibrary.org/obo/', true));

                        // Agonism or activation effects
                        row.push(parseEffectsDataToHtml(mark.activation_effects));

                        // Antagonism or inhibition effects
                        row.push(parseEffectsDataToHtml(mark.inhibition_effects));

                        // Publications
                        row.push(
                            mark.references.map(function (ref) {
                                var pub_url = ref.pmid ? 'https://europepmc.org/abstract/MED/' + ref.pmid : ref.ref_link;
                                var pub = '<a href="' + pub_url + '" target="_blank" '
                                    // add a tooltip (title) for 'HeCaTos' only
                                    + ((ref.ref_label === 'HeCaToS') ? ' title="HeCaToS Deliverable D01.5 (2015) funded by \'EU 7th Framework Programme (HEALTH-F4-2013-602156).\'" ' : '')
                                    + '>' + ref.ref_label + '</a>';
                                return pub;
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
                                'targets': [0, 1, 2],
                                'width': '27%'
                            },
                            {
                                'targets': [3],
                                'width': '19%'
                            }
                        ]
                    }, scope.target.approved_symbol + '-safety-effect'));
                }
            }
        };
    }]);
