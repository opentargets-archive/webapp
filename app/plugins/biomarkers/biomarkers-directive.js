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
                var dropdownColumns = [0, 1, 2, 3, 4];

                function formatDataToArray () {
                    // var rows = scope.target.cancerbiomarkers[0].map(function (mark) {
                    var rows = scope.target.cancerbiomarkers.map(function (mark) {
                        var row = [];

                        // biomarker
                        row.push(mark.individualbiomarker || mark.biomarker); // emtpy string evaluates to false

                        // diseases
                        // this is bit long but we display multiple diseases as a list (for clarity)
                        // and we also add a hidden comma at the of each line, so it looks clear when downloading the data.
                        // Or.... we could have just used a simple mark.diseases.map().join(', <br />')
                        var ds = '<a href="/disease/' + mark.diseases[0].id + '">' + mark.diseases[0].label + '</a>';
                        if (mark.diseases.length > 1) {
                            ds = '<ul>'
                                + mark.diseases.map(function (d, i, arr) {
                                    return '<li>'
                                            + '<a href="/disease/' + d.id + '">' + d.label + '</a>'
                                            + ((i + 1) < arr.length ? '<span style="display:none">, </span>' : '')    // hidden comma used for export
                                            + '</li>';
                                }).join('')
                                + '</ul>';
                        }
                        row.push(ds);

                        // drug
                        row.push(mark.drugfullname);

                        // association
                        row.push(mark.association);

                        // evidence level
                        row.push(mark.evidencelevel);


                        // references (publications)
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
                            if (ref_string.length > 0) {
                                ref_string += '<span style="display:none">; </span>';
                            }
                            ref_string += '<p>';
                            ref_string += mark.references.other.map(function (other) {
                                return '<a href="' + other.link + '" target="_blank">' + other.name + '</a>';
                            }).join(', ');
                            ref_string += '</p>';
                        }

                        ref_string = ref_string || 'N/A';
                        row.push(ref_string);


                        // Sources details (hidden, but exported)
                        var ref_details = '';

                        // pubmed
                        if (mark.references.pubmed && mark.references.pubmed.length > 0) {
                            ref_details += 'PubMed (id): ' +
                            mark.references.pubmed.map(function (pm) {
                                return pm.pmid;
                            }).join(', ');
                        }

                        // other references (abstracts)
                        if (mark.references.other && mark.references.other.length > 0) {
                            if (ref_details.length > 0) {
                                ref_details += '; ';
                            }
                            ref_details += 'Other: ' +
                            mark.references.other.map(function (other) {
                                return other.link;
                            }).join(', ');
                        }

                        row.push(ref_details);


                        // hidden for filtering
                        row.push(
                            mark.diseases.map(function (d) {
                                return d.label;
                            }).join(', ')
                        );

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
                                'width': '18%'
                            },
                            {
                                'targets': [3, 4, 5],
                                'width': '15%'
                            },
                            {
                                'targets': [6],
                                'visible': false
                            },
                            {
                                'targets': [1],
                                'mRender': otColumnFilter.mRenderGenerator(7),
                                'mData': otColumnFilter.mDataGenerator(1, 7)
                            },
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
