angular.module('otPlugins')
    .directive('otSafety', ['otUtils', '$timeout', 'otClearUnderscoresFilter', 'otUpperCaseFirstFilter', function (otUtils, $timeout, otClearUnderscoresFilter, otUpperCaseFirstFilter) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: '/plugins/safety/safety.html',
            scope: {
                target: '='
            },
            link: function (scope, elem, attrs) {

                function formatDataToArray () {
                    var rows = scope.target.safety.map(function (mark) {
                        var row = [];

                        // organs_systems_affected
                        var organs = '';
                        organs += '<ul>';
                        organs += mark.organs_systems_affected.map(function (sys) {
                            var content = otUpperCaseFirstFilter(sys.term_in_paper);
                            if (sys.code) {
                                content = '<a href="http://purl.obolibrary.org/obo/' + sys.code + '" target="_blank">' + content + '</a>';
                            }
                            return '<li>'
                                    + content
                                    + '</li>';
                        }).join('');
                        organs += '</ul>';
                        row.push(organs);

                        // agonism_activation_effects
                        row.push(Object.keys(mark.agonism_activation_effects).length === 0 ? 'No data available for this publication' : mark.agonism_activation_effects);

                        // antagonism_inhibition_effects
                        var effects = '';
                        var fx = mark.antagonism_inhibition_effects;
                        for (var i in fx) {
                            effects += '<h6>' + otUpperCaseFirstFilter(otClearUnderscoresFilter(i)) + '</h6>';
                            effects += '<ul>';
                            effects += fx[i].map(function (e) {
                                var content = otUpperCaseFirstFilter(e.term_in_paper);
                                if (e.code) {
                                    content = '<a href="/disease/' + e.code + '">' + content + '</a>';
                                }
                                return '<li>'
                                        + content
                                        + '</li>';
                            }).join('');
                            effects += '</ul>';
                        }
                        row.push(effects);

                        // reference
                        row.push('<a href="https://europepmc.org/abstract/MED/' + mark.pmid + '" target="_blank">' + mark.reference + '</a>');


                        return row;
                    });

                    return rows;
                }

                function initTable () {
                    var table = elem[0].getElementsByTagName('table');
                    $(table).DataTable(otUtils.setTableToolsParams({
                        'data': formatDataToArray(),
                        'ordering': true,
                        'autoWidth': false,
                        'paging': true,
                        'columnDefs': [
                            {
                                'targets': [0, 1, 2],
                                'width': '28%'
                            },
                            {
                                'targets': [3],
                                'width': '16%'
                            }
                        ]
                    }, scope.target.approved_symbol + '-safety'));
                }

                if (scope.target.safety) {
                    // initialize table in timeout
                    $timeout(function () {
                        initTable();
                    }, 0);
                }
            }
        };
    }]);
