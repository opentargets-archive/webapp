angular.module('otDirectives')
    .directive('otAdverseEventsTable', ['otUtils', function (otUtils) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'src/components/adverse-events-table/adverse-events-table.html',
            scope: {
                data: '=',
                output: '@?'    // optional output for filename export
            },
            link: function (scope, elem) {
                var maxLlr = 0; // the highest value llr in the data

                scope.$watch('data', function () {
                    if (scope.data) {
                        // Initialize the table as usual
                        initTable();
                    }
                });

                // Render functions take 3 params:
                // data, type and row
                function renderLog (d, type) {
                    var w = Math.round((d / maxLlr) * 90);
                    return '<div style="width:' + w + '%; background:#207dd0"><div style="margin-left:100%; padding-left:5px">' + d.toFixed(2) + '</div></div>';
                }

                // We format rows to arrays; this is not strictly necessary,
                // but it's handy as we can also sort by decreasing LLR.
                // If the api will return data sorted, this won't be necessary.
                // We also set the max LLR (llr of the first row, after sorting by llr value)
                function formatDataToArray (data) {
                    var d = data.map(
                        function (d) {
                            return [
                                _.capitalize(d.event),
                                d.count,
                                d.llr
                            ];
                        }
                    ).sort(function (a, b) {
                        return (b[2] - a[2]);
                    });
                    maxLlr = d[0][2];
                    return d;
                }

                function initTable () {
                    var table = elem[0].getElementsByTagName('table');
                    $(table).DataTable(otUtils.setTableToolsParams({
                        'data': formatDataToArray(scope.data.significant),
                        'ordering': true,
                        'order': [[2, 'des']],
                        'autoWidth': false,
                        'paging': true,
                        'columnDefs': [
                            {
                                'targets': [0],
                                'width': '35%'
                            },
                            {
                                'targets': [1],
                                'width': '15%'
                            },
                            {
                                'targets': [2],
                                'width': '50%',
                                'render': renderLog
                            }
                        ]
                    }, (scope.output ? scope.output + '-' : '') + 'adverse_events'));
                }
            }
        };
    }]);
