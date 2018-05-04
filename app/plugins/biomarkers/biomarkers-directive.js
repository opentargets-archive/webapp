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
                    var rows = scope.target.cancerbiomarkers[0].map(function (mark) {
                        var row = [];

                        // drug
                        row.push(mark.drugfullname);

                        // association
                        row.push(mark.association);

                        // disease
                        row.push(mark.disease);

                        // evidence level
                        row.push(mark.evidencelevel);

                        // references
                        var ref_string = '';

                        // pubmed
                        if (mark.references.pubmed && mark.references.pubmed.length > 0) {
                            ref_string += otUtils.getPublicationsString(
                                mark.references.pubmed.map(function (pm) {
                                    return pm.pmid;
                                })
                            );
                        }

                        // other references (abstracts)
                        if (mark.references.other && mark.references.other.length > 0) {
                            ref_string += '<p>';
                            ref_string += mark.references.other.map(function (other) {
                                return '<a href="' + other.link + '" target="_blank">' + other.name + '</a>';
                            })
                            ref_string += '</p>';
                        }

                        ref_string = ref_string || 'N/A';
                        row.push(ref_string);

                        // biomarker
                        row.push(mark.individualbiomarker || mark.biomarker); // emtpy string evaluates to false

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
                                'targets': [3, 4, 5],
                                'width': '15%'
                            },
                            {
                                'targets': [1],
                                'width': '13%'
                            },
                            {
                                'targets': [0, 2],
                                'width': '21%'
                            }
                            // {
                            //     'targets': [3],
                            //     'width': '18%'
                            // },
                            // {
                            //     'targets': [4],
                            //     'width': '6%'
                            // },
                            // {
                            //     'targets': [5, 6],
                            //     'width': '12%'
                            // }
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
