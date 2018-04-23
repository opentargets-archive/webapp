angular.module('otPlugins')
    .directive('otBiomarkers', ['otUtils', 'otColumnFilter', '$timeout', function (otUtils, otColumnFilter, $timeout) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: '/plugins/biomarkers/biomarkers.html',
            scope: {
                target: '='
            },
            link: function (scope, elem, attrs) {
                var dropdownColumns = [0, 1, 2, 3, 4, 5, 6, 7, 8];

                function formatDataToArray () {
                    var rows = scope.target.cancerbiomarkers.cancer_biomarkers.map(function (mark) {
                        // Drug
                        // Disease
                        // Biomarker
                        // Individual
                        // Evidence
                        // Association
                        var row = [];

                        // drug
                        row.push(mark.drug);
                        row.push(mark.drugfamily);
                        row.push(mark.drugfullname);

                        // disease
                        row.push(mark.disease);
                        row.push(mark.diseaseID);

                        // biomarker
                        row.push(mark.biomarker);
                        row.push(mark.individualbiomarker);

                        row.push(mark.evidencelevel);

                        row.push(mark.association);

                        return row;
                    });

                    return rows;
                }

                function initTable () {
                    var table = elem[0].getElementsByTagName('table');
                    $(table).DataTable(otUtils.setTableToolsParams({
                        'data': formatDataToArray(),
                        'ordering': true,
                        // 'order': [[1, 'asc']],
                        'autoWidth': false,
                        'paging': true,
                        'columnDefs': [
                            {
                                'targets': [0, 1, 2],
                                'width': '12%'
                            },
                            {
                                'targets': [3],
                                'width': '18%'
                            },
                            {
                                'targets': [4],
                                'width': '6%'
                            },
                            {
                                'targets': [5,6],
                                'width': '12%'
                            },
                            {
                                'targets': [7,8],
                                'width': '10%'
                            }
                        ],
                        initComplete: otColumnFilter.initCompleteGenerator(dropdownColumns)
                    }, scope.target.approved_symbol + '-biomarkers'));
                }

                if (scope.target.cancerbiomarkers) {
                    // initialize table in timeout
                    $timeout(function () {
                        initTable();
                    }, 0);
                }
            }
        };
    }]);
