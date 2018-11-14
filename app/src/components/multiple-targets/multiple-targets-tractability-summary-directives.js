angular.module('otDirectives')

    .directive('multipleTargetsTractabilitySummary', ['otUtils', 'otConfig', '$timeout', function (otUtils, otConfig, $timeout) {
        'use strict';

        var tractabilityCategories = {
            smallmolecule: [
                {
                    label: 'Clinical precedence',
                    labelHtml: '<tspan>Clinical</tspan><tspan dy="10" x=0>precedence</tspan>',  // multiline html label for the flower petals
                    buckets: [1, 2, 3]
                },

                {
                    label: 'Discovery precedence',
                    labelHtml: '<tspan>Discovery</tspan><tspan dy="10" x=0>precedence</tspan>',
                    buckets: [4, 7]
                },

                {
                    label: 'Predicted tractable',
                    labelHtml: '<tspan>Predicted</tspan><tspan dy="10" x=0>tractable</tspan>',
                    buckets: [5, 6, 8]
                }

                , {
                    label: 'Unknown',
                    buckets: [10]
                }
            ],

            antibody: [
                {
                    label: 'Clinical precedence',
                    labelHtml: '<tspan>Clinical</tspan><tspan dy="10" x=0>precedence</tspan>',
                    buckets: [1, 2, 3]
                },

                {
                    label: 'Predicted tractable high confidence',
                    labelHtml: '<tspan>Predicted tractable</tspan><tspan dy="10" x=0>(high confidence)</tspan>',
                    buckets: [4, 5]
                },

                {
                    label: 'Predicted tractable - medium to low confidence',
                    labelHtml: '<tspan>Predicted tractable</tspan><tspan dy="10" x=0>(mid-low confidence)</tspan>',
                    buckets: [6, 7, 8]
                },

                // {
                //     label: 'Predicted tractable - Human Protein Atlas',
                //     labelHtml: '<tspan>Predicted tractable</tspan><tspan dy="10" x=0>(Human Protein Atlas)</tspan>',
                //     buckets: [9]
                // }

                {
                    label: 'Unknown',
                    buckets: [10]
                }
            ]
        };


        function formatDataToArray (d) {
            var data = [];
            d.forEach(function (t) {
                console.log('formatting ', t);
                var row = [];
                row.push('<a href="/target/' + t.id + '">' + t.symbol + '</a>');
                tractabilityCategories.smallmolecule.forEach(function (sm) {
                    // t.tractability.smallmolecule.buckets;
                    var bob = Math.min(
                        sm.buckets.filter(function (value) { return -1 !== t.tractability.smallmolecule.buckets.indexOf(value); }).length,
                        1
                    );
                    row.push(bob);
                });
                tractabilityCategories.antibody.forEach(function (ab) {
                    var bob = Math.min(
                        ab.buckets.filter(function (value) { return -1 !== t.tractability.antibody.buckets.indexOf(value); }).length,
                        1
                    );
                    row.push(bob);
                });

                data.push(row);
            });
            return data;
        }


        /*
         * Setup the table cols and return the DT object
         */
        var setupTable = function (table, data, filename) {
            // var t = $(table).DataTable({
            //     'destroy': true,
            //     'pagingType': 'simple',
            //     'dom': '<"clearfix" <"clear small" i><"pull-left small" f><"pull-right" B>>rt<"clearfix" <"pull-left small" l><"pull-right small" p>>',
            //     'buttons': [
            //         {
            //             text: '<span title="Download as .csv"><span class="fa fa-download"></span> Download .csv</span>',
            //             action: download
            //         }
            //     ],
            //     'columnDefs': [
            //         {'orderSequence': ['desc', 'asc'], 'targets': [1, 2, 3, 4, 5, 6, 7, 8]},
            //         {'orderSequence': ['asc', 'desc'], 'targets': [0]},
            //         {
            //             'targets': getHiddenDatatypesCols(),
            //             'visible': false
            //         },
            //         {
            //             'targets': [2, 3, 4, 5, 6, 7, 8],
            //             'width': '7%'   // TODO: this doesn't seem to work when multi-row thead used
            //         },
            //         {
            //             'targets': [9, 10],
            //             'orderable': false
            //         }
            //     ],
            //     'processing': false,
            //     'serverSide': false,

            //     // "order" : [[2, "desc"], [10, "desc"]],
            //     'order': [1, 'desc'],   // stt.o || [2, "desc"],
            //     'orderMulti': false,
            //     'autoWidth': false,
            //     'ordering': true,
            //     'lengthMenu': [[10, 50, 200, 500], [10, 50, 200, 500]],
            //     'pageLength': 50,
            //     'language': {
            //         'info': 'Showing _START_ to _END_ of _TOTAL_ targets'
            //     }
            // }, filename);

            var t = $(table).DataTable(otUtils.setTableToolsParams({
                'data': formatDataToArray(data),
                'ordering': true,
                'order': [[0, 'asc']],
                'autoWidth': false,
                'paging': true,
                'columnDefs': [
                    {
                        'targets': [0,1,2,3,4,5,6,7,8],
                        'width': '10%'
                    }
                ]
            }, filename));
            return t;
        };


        return {
            restrict: 'E',
            templateUrl: 'src/components/multiple-targets/multiple-targets-tractability-summary.html',
            scope: {
                target: '='
            },
            link: function (scope, elem) {
                otConfig;
                // table itself
                // var table = elem[0].getElementsByTagName('table');
                // var dtable = setupTable(table, scope.target, scope.filename);

                scope.cols = tractabilityCategories;

                console.log(
                    // scope.target.map(function(t){return {antibody:t.tractability.antibody.buckets, smallmolecule:t.tractability.smallmolecule.buckets}})
                    // scope.target.map(function (t) { return t.tractability ;})
                    scope.target
                );

                var tractabilitydata = scope.target
                    .filter(function (t) {
                        return t.tractability;
                    })
                    .map(function (t) {
                        return {
                            symbol: t.approved_symbol,
                            id: t.ensembl_gene_id,
                            tractability: t.tractability
                        };
                    });
                var table = elem[0].getElementsByTagName('table');
                var dtable;
                
                $timeout(function(){
                    dtable = setupTable(table, tractabilitydata, 'scopefilename');
                }, 0);
                

                // dtable;

                // approved_symbol: "FLT1"
                // drugs: {chembl_drugs: Array(1)}
                // ensembl_gene_id: "ENSG00000102755"
                // reactome: (2) [{…}, {…}]
                // tractability: {smallmolecule: {…}, antibody: {…}}
                // uniprot_id: "P17948"


                // scope.$watch('target', function () {
                //     if (!scope.target) {
                //         return;
                //     }

                //     $('#target-list-drugs').DataTable(otUtils.setTableToolsParams({
                //         'data': formatDrugDataToArray(scope.drugs),
                //         'ordering': true,
                //         'order': [[3, 'desc']],
                //         'autoWidth': false,
                //         'paging': true,
                //         'columnDefs': [
                //             {
                //                 'targets': [0, 4],
                //                 'width': '20%'
                //             },
                //             {
                //                 'targets': [1, 3],
                //                 'width': '15%'
                //             }
                //         ]

                //     }, scope.target.length + '-targets-drugs'));

                // });
            }
        };
    }]);
