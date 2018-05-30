angular.module('otPlugins')
    .directive('otCancerHallmark', ['otUtils', 'otColumnFilter', '$timeout', function (otUtils, otColumnFilter, $timeout) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: '/plugins/cancer-hallmark/cancer-hallmark.html',
            scope: {
                target: '='
            },
            link: function (scope, elem, attrs) {
                // define the set list of hallmarks as API only returns those with info
                var hallmarks = [
                    'proliferative signalling',
                    'suppression of growth',
                    'escaping immunic response to cancer',
                    'cell replicative immortality',
                    'tumour promoting inflammation',
                    'invasion and metastasis',
                    'angiogenesis',
                    'genome instability and mutations',
                    'escaping programmed cell death',
                    'change of cellular energetics'
                ];

                function formatDataToArray () {
                    var rows = scope.target.hallmarks.cancer_hallmarks.map(function (mark) {
                        var row = [];
                        row.push(mark.label);
                        row.push(mark.description);
                        var s = '';
                        s += (mark.promote) ? '<span>Promotes</span>' : '';
                        s += (mark.promote && mark.suppress) ? '<br />' : '';
                        s += (mark.suppress) ? '<span>Suppresses</span>' : '';
                        row.push(s);

                        var l = '<a href="http://europepmc.org/search?query=EXT_ID:' + mark.pmid + '" target="_blank">' + mark.pmid + '</a>';
                        row.push(l);

                        var effect = '';
                        if (mark.promote && mark.suppress) {
                            effect = 'Promotes and suppresses';
                        } else if (mark.promote) {
                            effect = 'Promotes';
                        } else if (mark.suppress) {
                            effect = 'Suppresses';
                        }
                        row.push(effect);
                        return row;
                    });

                    return rows;
                }

                function initTable () {
                    var table = elem[0].getElementsByTagName('table')[1];

                    $(table).DataTable(otUtils.setTableToolsParams({
                        'data': formatDataToArray(),
                        'ordering': true,
                        // 'order': [[1, 'asc']],
                        'autoWidth': false,
                        'paging': true,
                        'columnDefs': [
                            {
                                'targets': [0],
                                'width': '25%'
                            },
                            {
                                'targets': [1],
                                'width': '49%'
                            },
                            {
                                'targets': [2],
                                'width': '13%',
                                'mRender': otColumnFilter.mRenderGenerator(4),
                                'mData': otColumnFilter.mDataGenerator(2, 4)
                            },
                            {
                                'targets': [3],
                                'width': '13%'
                            }
                        ],
                        initComplete: otColumnFilter.initCompleteGenerator(dropdownColumns)
                    }, scope.target.approved_symbol + '-cancer_hallmark'));
                }

                if (scope.target.hallmarks) {
                    // lightweight list to build visualizations:
                    // only store label, suppress and promote
                    scope.hallmarks = hallmarks.map(function (m) {
                        // for this hallmark, find if it has data
                        return scope.target.hallmarks.cancer_hallmarks.filter(function (ch) {
                            return ch.label === m;
                        }).reduce(
                            // reduce array: promote/suppress are not the same for each item,
                            // so might have both promote suppress but across different items
                            function (accumulator, current) {
                                return {
                                    label: m,
                                    promote: accumulator.promote || current.promote,
                                    suppress: accumulator.suppress || current.suppress
                                };
                            },
                            // initialization object (as might not data for a certain hallmark)
                            {label: m, suppress: false, promote: false}
                        );
                    });


                    // set the selected hallmark when user clicks on table row
                    // selected is just the label
                    // selected list is a list of those matching the label
                    scope.setSelected = function (m) {
                        scope.selected = m;
                        scope.selectedList = scope.target.hallmarks.cancer_hallmarks.filter(function (ch) {
                            return ch.label === scope.selected;
                        });
                    };

                    var dropdownColumns = [0, 2];

                    // initialize table in timeout
                    $timeout(function () {
                        initTable();
                    }, 0);
                }
            }
        };
    }]);
