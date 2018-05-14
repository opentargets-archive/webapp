angular.module('otPlugins')
    .directive('otMousePhenotypes', ['otColumnFilter', 'otUtils', '$timeout', function (otColumnFilter, otUtils, $timeout) {
        'use strict';

        function formatPhenotypesToArray (data) {
            var newData = [];
            if (data) {
                data.forEach(function (d) {
                    d.phenotypes.forEach(function (p) {
                        if (p.genotype_phenotype && p.genotype_phenotype.length > 0) {
                            p.genotype_phenotype.forEach(function (g) {
                                var row = [];
                                // 0. Mouse gene
                                row.push('<a target="_blank" href="http://www.informatics.jax.org/marker/' + d.mouse_gene_id + '">' + d.mouse_gene_symbol + '</a>');

                                // 1. Phenotype category
                                row.push(p.category_mp_label);

                                // 2. Phenotype label
                                row.push(g.mp_label);

                                // 3. Allelic composition
                                row.push(
                                    g.subject_allelic_composition.split(',')
                                        .map(function (allele) {
                                            return otUtils.allelicComposition2Html(allele);
                                        })
                                        .join('<br />')
                                        +
                                        '<div class="small text-lowlight">' + otUtils.allelicComposition2Html(g.subject_background) + '</div>'
                                );

                                // Genetic background
                                // row.push(g.subject_background);

                                // 4. References
                                if (g.pmid) {
                                    row.push(otUtils.getPublicationsString(g.pmid.split(',')));
                                } else {
                                    row.push('N/A');
                                }

                                // 5. hidden PMID
                                row.push(g.pmid || 'N/A');

                                // 6. hidden columns for filtering
                                row.push(d.mouse_gene_symbol); // variant

                                newData.push(row);
                            });
                        } else {
                            // TODO:
                            // given we're not showing rows with just N/A, should (can) we just delete this whole block of code?
                            var row = [];
                            // 0. gene symbol
                            row.push('<a target="_blank" href="http://www.informatics.jax.org/marker/' + d.mouse_gene_id + '">' + d.mouse_gene_symbol + '</a>');

                            // 1. Phenotype category
                            row.push(p.category_mp_label);

                            // fill with N/A
                            row.push('N/A');
                            row.push('N/A');
                            row.push('N/A');
                            row.push('N/A');

                            // 6. hidden columns for filtering
                            row.push(d.mouse_gene_symbol); // variant

                            // LUCA: just show rows with phenotype information to avoid N/A rows...
                            // newData.push(row);
                        }
                    });
                });
            }
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
                // TODO: targets without phenotypes are giving an empty array instead of an empty object:
                // https://github.com/opentargets/data_pipeline/issues/221
                if (!Object.keys(scope.target.mouse_phenotypes).length) {
                    scope.noPhenotypes = true;
                    return;
                }

                var data = formatPhenotypesToArray(scope.target.mouse_phenotypes);

                scope.data = data;
                scope.sources = [{label: 'MGI', url: 'http://www.informatics.jax.org/'}];

                var dropdownColumns = [0, 1];
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
                                'width': '14%'
                            },
                            // {
                            //     'targets': [2, 3, 4],
                            //     'width': '22%'
                            // },
                            // {
                            //     'targets': [1],
                            //     'width': '15%'
                            // }
                            {
                                'targets': [1, 2, 3],
                                'width': '24%'
                            },
                            {
                                'targets': [5],
                                'visible': false
                            }
                        ],

                        initComplete: otColumnFilter.initCompleteGenerator(dropdownColumns)
                    }));
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
