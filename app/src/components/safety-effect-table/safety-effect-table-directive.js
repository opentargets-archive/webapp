/**
 * Known safety effects table
 *
 * ext object params:
 *  isLoading, hasError, data
 */
angular.module('otDirectives')

    /* Directive to display the rna expression data table */
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

                        // organs_systems_affected
                        row.push(parseArrayToList(mark.organs_systems_affected, 'http://purl.obolibrary.org/obo/', true));

                        // agonism_activation_effects
                        row.push(parseEffectsDataToHtml(mark.activation_effects));

                        // antagonism_inhibition_effects
                        row.push(parseEffectsDataToHtml(mark.inhibition_effects));

                        // reference
                        row.push(
                            mark.references.map(function (ref) {
                                if (ref.pmid) {
                                    // return ref.pmid;
                                    return '<a href="https://europepmc.org/abstract/MED/' + ref.pmid + '" target="_blank">' + ref.ref_label + '</a>';
                                } else {
                                    // return ref.ref_link;
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
