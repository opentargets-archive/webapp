angular.module('otPlugins')
    .directive('otCancerHallmark', ['otUtils', '$timeout', function (otUtils, $timeout) {
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


                // lightweight list to build visualizations:
                // only store label, suppress and promote
                scope.hallmarks = hallmarks.map(function (m) {
                    var chm = scope.target.hallmarks.cancer_hallmarks.filter(function (ch) {
                        return ch.label === m;
                    })[0];
                    chm = chm || {};

                    return {
                        label: m,
                        suppress: chm.suppress || false,
                        promote: chm.promote || false
                    };
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
                                'targets': [2, 3],
                                'width': '13%'
                            }
                        ]
                    }, scope.target.approved_symbol + '-cancer_hallmark'));
                }


                // initialize table in timeout
                $timeout(function () {
                    initTable();
                }, 0);
            }
        };
    }]);
