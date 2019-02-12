angular.module('otDirectives')
    .directive('multipleTargetsGoSummary', ['$http', 'otUtils', function ($http, otUtils) {
        var goCategoryMap = {
            BP: 'Biological Process',
            CC: 'Cellular component',
            MF: 'Molecular Function'
        };
        function parseGOdata (data) {
            // var tableData = [];
            // for (var i = 0; i < data.length; i++) {
            //     var dataRow = data[i];
            //     var dataFields = dataRow.split('\t');
            //     if (dataFields[8] && (dataFields[8].substring(0, 3) === 'GO:')) {
            //         var tableRow = [];
            //         // GO term id
            //         tableRow.push(dataFields[8]);

            //         // GO term description
            //         tableRow.push(dataFields[11]);

            //         // GO category
            //         var category;
            //         var symbol = dataFields[9];
            //         if (symbol === 'BP') {
            //             category = 'Biological Process';
            //         } else if (symbol === 'CC') {
            //             category = 'Cellular component';
            //         } else if (symbol === 'MF') {
            //             category = 'Molecular Function';
            //         }
            //         tableRow.push(category);

            //         // GO term pvalue
            //         tableRow.push(dataFields[2]);

            //         var targetsInTerm = dataFields[13].split(',');
            //         // GO term number of targets
            //         tableRow.push(targetsInTerm.length);

            //         // GO targets
            //         tableRow.push(targetsInTerm.join(', '));

            //         tableData.push(tableRow);
            //     }
            // }
            // return tableData;
            return data.result
                .filter(function (d) { return d.source.substring(0, 3) === 'GO:'; })
                .map(function (d) {
                    return [
                        d.native, // GO term id
                        d.description, // GO term description
                        goCategoryMap[d.source.substring(3, 5)], // GO term category
                        d.p_value // GO term pvalue
                    ];
                });
        }

        return {
            restrict: 'E',
            templateUrl: 'src/components/multiple-targets/multiple-targets-go-summary.html',
            scope: {
                target: '=',
                width: '='
            },
            link: function (scope) {
                scope.$watchGroup(['target'], function () {
                    if (!scope.target) {
                        return;
                    }
                    scope.showSpinner = true;


                    // (previously, gProfiler had an unusual POST format)  
                    // curl -X POST -d 'output=mini&organism=hsapiens&significant=1&sort_by_structure=1&ordered_query=0&as_ranges=0&no_iea=0&underrep=0&hierfiltering=none&user_thr=1&min_set_size=0&max_set_size=0&threshold_algo=analytical&domain_size_type=annotated&query=braf+pten+brca1+brca2' http://biit.cs.ut.ee/gprofiler/
                    // var opts = 'output=mini&organism=hsapiens&significant=1&sort_by_structure=1&ordered_query=0&as_ranges=0&no_iea=0&underrep=0&hierfiltering=none&user_thr=1&min_set_size=0&max_set_size=0&threshold_algo=analytical&domain_size_type=annotated&query=' + (scope.target.map(function (d) { return d.approved_symbol; }).join('+'));

                    // Call gProfiler to get enriched GO terms
                    var opts = {
                        organism: 'hsapiens',
                        user_threshold: 1,
                        sources: ['GO:MF', 'GO:CC', 'GO:BP'],
                        query: scope.target.map(function (d) { return d.approved_symbol; })
                    };
                    const config = {
                        headers: {'Content-Type': 'application/json'}
                    };

                    // The proxy is setting this header now
                    // var httpConfig = {
                    //     headers: {
                    //         'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                    //     }
                    // };
                    // $http.post('https://biit.cs.ut.ee/gprofiler/', opts, httpConfig)
                    // $http.post(otConsts.PROXY + 'biit.cs.ut.ee/gprofiler/api/gost/profile/', opts, config)
                    $http.post('https://biit.cs.ut.ee/gprofiler/api/gost/profile/', opts, config)
                        .then(function (resp) {
                            scope.showSpinner = false;
                            var data = resp.data;
                            $('#target-list-go2-terms').DataTable(otUtils.setTableToolsParams({
                                'data': parseGOdata(data),
                                'ordering': true,
                                'order': [[3, 'asc']],
                                'autoWidth': false,
                                'paging': true,
                                'columnDefs': [
                                    {
                                        targets: [0],
                                        visible: false
                                    }
                                ]

                            }, scope.target.length + '-targets-enriched-go-terms'));
                        });
                });
            }
        };
    }]);
