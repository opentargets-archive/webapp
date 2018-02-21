angular.module('otPlugins')
    .directive('otCancerHallmark', [/* 'otColumnFilter', 'otUtils', '$timeout', 'otConfig',*/function (/* otColumnFilter, otUtils, $timeout, otConfig*/) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: '/plugins/cancer-hallmark/cancer-hallmark.html',
            scope: {
                target: '='
            },
            link: function (scope, elem, attrs) {
                // console.log('bob');
                // console.log('target: ', scope.target);

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

                // lightweight list to build visualizations
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


                scope.setSelected = function (m) {
                    console.log('!');
                    scope.selected = m;
                    scope.selectedList = scope.target.hallmarks.cancer_hallmarks.filter(function (ch) {
                        return ch.label === scope.selected;
                    });
                    console.log('selected: ', scope.selected);
                };

                scope.getSelected = function () {
                    return hallmarks.filter(function (ch) {
                        return ch.label === scope.selected;
                    });
                };

                // TODO: targets without phenotypes are giving an empty array instead of an empty object:
                // https://github.com/opentargets/data_pipeline/issues/221

                // if (!Object.keys(scope.target.mouse_phenotypes).length) {
                //     scope.noPhenotypes = true;
                //     return;
                // }

                // var data = formatPhenotypesToArray(scope.target.mouse_phenotypes);

                // scope.data = data;
                // scope.sources = [{label: 'MGI', url: 'http://www.informatics.jax.org/'}];

                // var dropdownColumns = [0, 1];
                // $timeout(function () {
                //     var table = elem[0].getElementsByTagName('table');
                //     $(table).dataTable(otUtils.setTableToolsParams({
                //         'data': data,
                //         'autoWidth': false,
                //         'paging': true,
                //         'order': [[0, 'asc']],
                //         'columnDefs': [
                //             {
                //                 'targets': [0],
                //                 'mRender': otColumnFilter.mRenderGenerator(5),
                //                 'mData': otColumnFilter.mDataGenerator(0, 5),
                //                 'width': '14%'
                //             },
                //             // {
                //             //     'targets': [2, 3, 4],
                //             //     'width': '22%'
                //             // },
                //             // {
                //             //     'targets': [1],
                //             //     'width': '15%'
                //             // }
                //             {
                //                 'targets': [1, 2, 3],
                //                 'width': '24%'
                //             }
                //         ],

                //         initComplete: otColumnFilter.initCompleteGenerator(dropdownColumns)
                //     }));
                // }, 0);
            }
        };
    }]);
