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
                            row.push(d.mouse_gene_symbol);

                            // Phenotype category
                            row.push(p.category_mp_label);

                            // Phenotype label
                            row.push(g.mp_label);

                            // Allelic composition
                            row.push(g.subject_allelic_composition);

                            // Genetic background
                            row.push(g.subject_background);

                            // References
                            row.push(g.pmid);

                            newData.push(row);
                        })
                    } else {
                        var row = [];
                        row.push(d.mouse_gene_symbol);

                        // Phenotype category
                        row.push(p.category_mp_label);

                        // fill with N/A
                        row.push('N/A');
                        row.push('N/A');
                        row.push('N/A');
                        row.push('N/A');
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

                var dropdownColumns = [0,1,2,3,4,5];
                $timeout(function () {
                    var table = elem[0].getElementsByTagName('table');
                    $(table).dataTable(otUtils.setTableToolsParams({
                        'data': data,
                        'autoWith': false,
                        'paging': true,
                        'order': [[0, 'asc']],
                        initComplete: otColumnFilter.initCompleteGenerator(dropdownColumns)
                    }))
                }, 0);
            }
        };
    }]);
