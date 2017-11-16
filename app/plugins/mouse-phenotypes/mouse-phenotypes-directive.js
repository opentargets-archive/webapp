angular.module('otPlugins')
    .directive('otMousePhenotypes', ['otColumnFilter', 'otUtils', '$timeout', function (otColumnFilter, otUtils, $timeout) {
        'use strict';

        function formatPhenotypesToArray(data) {
            var newData = [];
            data.forEach(function (d) {
                d.phenotypes.forEach(function (p) {

                    if (p.genotype_phenotype && p.genotype_phenotype.length) {
                        p.genotype_phenotype.forEach(function (g) {
                            var row = [];
                            // Mouse gene
                            row.push('<a target="_blank" href="http://www.informatics.jax.org/marker/' + d.mouse_gene_id + '">' + d.mouse_gene_symbol + '</a>');

                            // Phenotype category
                            row.push(p.category_mp_label);

                            // Phenotype label
                            row.push(g.mp_label);

                            // Allelic composition
                            row.push(otUtils.allelicComposition2Html(g.subject_allelic_composition));

                            // Genetic background
                            row.push(g.subject_background);

                            // References
                            if (g.pmid) {
                                row.push(otUtils.getPublicationsString(g.pmid.split(',')));
                            } else {
                                row.push('N/A');
                            }

                            // hidden columns for filtering
                            row.push(d.mouse_gene_symbol); // variant

                            newData.push(row);
                        })
                    } else {
                        var row = [];
                        row.push('<a target="_blank" href="http://www.informatics.jax.org/marker/' + d.mouse_gene_id + '">' + d.mouse_gene_symbol + '</a>');

                        // Phenotype category
                        row.push(p.category_mp_label);

                        // fill with N/A
                        row.push('N/A');
                        row.push('N/A');
                        row.push('N/A');
                        row.push('N/A');

                        // hidden columns for filtering
                        row.push(d.mouse_gene_symbol); // variant
                        newData.push(row);
                    }
                });

            });

            return newData;
        }

        return {
            restrict: 'E',
            templateUrl: '/plugins/mouse-phenotypes/mouse-phenotypes.html',
            scope: {
                target: '=',
                width: '='
            },
            link: function (scope, elem) {
                var data = formatPhenotypesToArray(scope.target.mouse_phenotypes);

                var dropdownColumns = [0,1];
                $timeout(function () {
                    var table = elem[0].getElementsByTagName('table');
                    $(table).dataTable(otUtils.setTableToolsParams({
                        'data': data,
                        'autoWidth': false,
                        'paging': true,
                        'order': [[0, 'asc']],
                        'columnDefs': [
                            {
                                'targets': [0],
                                'mRender': otColumnFilter.mRenderGenerator(6),
                                'mData': otColumnFilter.mDataGenerator(0, 6),
                                'width': '8%'
                            },
                            {
                                'targets': [2, 3, 4],
                                'width': '23%'
                            },
                            {
                                'targets': [1],
                                'width': '12%'
                            }
                        ],

                        initComplete: otColumnFilter.initCompleteGenerator(dropdownColumns)
                    }))
                }, 0);
            }
        };
    }]);

    // 'columnDefs': [
    //     {
    //         'targets': [0],    // the access-level (public/private icon)
    //         'visible': otConfig.show_access_level,
    //         'width': '3%'
    //     },
    //     {
    //         'targets': [6],    // score
    //         'visible': false
    //     },
    //     {
    //         'targets': [2, 3, 4],
    //         'width': '20%'
    //     },
    //     {
    //         'targets': [5],
    //         'width': '10%'
    //     }
    // ],