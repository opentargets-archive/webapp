angular.module('cttvDirectives')
    /**
    *
    * Options for configuration are:
    *   filename: the string to be used as filename when exporting the directive table to excel or pdf; E.g. "targets_associated_with_BRAF"
    *   loadprogress: the name of the var in parent scope to be used as flag for API call progress update. E.g. laodprogress="loading"
    *
    * Example:
    *   <ot-disease-associations target="{{search.query}}" filename="targets_associated_with_BRAF" loadprogress="loading"></ot-disease-associations>
    *
    *   In this example, "loading" is the name of the var in the parent scope, pointing to $scope.loading.
    *   This is useful in conjunction with a spinner where you can have ng-show="loading"
    */
    .directive('cttvHpaTissueExpression', ['otAPIservice', 'otUtils', function (otAPIservice, otUtils) {
        'use strict';

        var colorScale = otUtils.colorScales.BLUE_1_3; // blue orig
        var colorScale10 = otUtils.colorScales.BLUE_1_10;

        var labelScale = d3.scale.ordinal()
            .domain([1, 2, 3])
            .range(['Low', 'Medium', 'High']);

        var labelScale10 = function (v) {
            if (v < 4) {
                return 'Low';
            }
            if (v < 7) {
                return 'Medium';
            }
            return 'High';
        };

        var getColorStyleString = function (value, scale, label) {
            var span = '';

            if (value === 0) {
                span = '<span class=\'value-0\' title=\'Not expressed\'>' + value + '</span>';
            } else if (value > 0) {
                var c = scale(value);
                var l = label(value);
                span = '<span style=\'color: ' + c + '; background: ' + c + ';\' title=\'Expression: ' + l + '\'>' + value + '</span>';
            } else {
                span = '<span class=\'no-data\' title=\'No data\'></span>'; // quick hack: where there's no data, don't put anything so the sorting works better
            }


            return span;
        };

        var cols = [
            'Tissue',
            'Protein',
            'RNA',
            ''
        ];

        return {

            restrict: 'AE',

            scope: {
                target: '=',
                // loadprogress : '=',
                filename: '@'
            },

            template: '<cttv-matrix-table></cttv-matrix-table>'
            + '<cttv-matrix-legend colors="legendData"></cttv-matrix-legend>'
            + '<cttv-matrix-legend colors="colors" layout="h"></cttv-matrix-legend>',

            link: function (scope, elem) {
                // set the load progress flag to true before starting the API call
                // scope.loadprogress = true;

                // Watch for data changes
                scope.$watch(
                    'target',
                    function () {
                        // move otAPIservice.getExpression ({ in here
                        // ......

                        if (scope.target) {
                            otAPIservice.getExpression({
                                'method': 'GET',
                                'params': {
                                    gene: scope.target  // TODO: should be TARGET in API!!!
                                }
                            })
                                .then(

                                // success
                                    function (resp) {
                                    // set hte load progress flag to false once we get the results
                                    // scope.loadprogress = false;

                                        var data = resp.body.data[scope.target].tissues;
                                        var newData = [];

                                        for (var tissue in data) {
                                            var row = [];
                                            row.push(tissue);
                                            row.push(getColorStyleString(data[tissue].protein.level, colorScale, labelScale));
                                            row.push(getColorStyleString(data[tissue].rna.level, colorScale10, labelScale10));
                                            row.push('');
                                            newData.push(row);
                                        }

                                        // -----------------------
                                        // Initialize table etc
                                        // -----------------------

                                        // table itself
                                        var table = elem.children().eq(0)[0];
                                        var dtable = $(table).dataTable(otUtils.setTableToolsParams({
                                            'data': newData,
                                            'columns': (function () {
                                                var a = [];
                                                for (var i = 0; i < cols.length; i++) {
                                                    a.push({'title': '<div><span title=\'' + cols[i] + '\'>' + cols[i] + '</span></div>'});
                                                }
                                                return a;
                                            })(),
                                            'columnDefs': [
                                                {'orderSequence': ['desc', 'asc'], 'targets': '_all'}
                                            ],
                                            'order': [[0, 'asc']],
                                            'autoWidth': false,
                                            'ordering': true,
                                            'lengthMenu': [[10, 25, 50, 100, -1], [10, 25, 50, 100, 'All']],
                                            'pageLength': 50
                                        }, scope.filename));


                                        // legend stuff
                                        scope.colors = [];
                                        for (var i = 1; i <= 3; i++) {
                                            scope.colors.push({color: colorScale(i), label: labelScale(i)});
                                        // $log.log(i +" : "+ labelScale(i));
                                        }

                                        scope.legendData = [
                                            {label: 'No data', class: 'no-data'},
                                            {label: 'Not expressed', class: 'value-0'}
                                        ];
                                    },

                                    // error
                                    otAPIservice.defaultErrorHandler
                                );
                        }
                    }

                ); // end watch
            } // end link
        }; // end return
    }]);
