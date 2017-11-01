angular.module('otDirectives')
    .directive('multipleTargetsGoSummary', ['$log', 'otApi', '$http', 'otUtils', function ($log, otApi, $http, otUtils) {

        function formatGoDataToArray(targetsByGo, goArr) {
            var data = [];

            for (var i=0; i<goArr.length; i++) {
                var row = [];
                var go = goArr[i];

                // GO term id
                row.push(go.key);

                // GO term description
                row.push(targetsByGo[go.key].term);

                // GO category
                var category;
                var symbol = targetsByGo[go.key].category;
                if (symbol === 'P') {
                    category = 'Biological Process';
                } else if (symbol === 'C') {
                    category = 'Cellular component';
                } else if (symbol === 'F') {
                    category = 'Molecular Function';
                }
                row.push(category);

                // Go term pvalue
                row.push(1);

                // GO term number of targets
                row.push(go.doc_count);

                // Go targets
                row.push(targetsByGo[go.key].targets.join(', '));

                data.push(row);
            }
            return data;
        }
        
        function getTargetsByGo(data) {
            var tbg = {};
            for (var i=0; i<data.length; i++) {
                var d = data[i];
                for (var j=0; j<d.go.length; j++) {
                    var g = d.go[j];
                    if (!tbg[g.id]) {
                        var termArr = g.value.term.split(':');
                        tbg[g.id] = {
                            targets: [],
                            id: g.id,
                            category: termArr[0],
                            term: termArr[1]
                        };
                    }
                    tbg[g.id].targets.push(d.approved_symbol);
                }
            }
            return tbg;
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

                    var targetIds = scope.target.map(function (t) {
                        return t.ensembl_gene_id;
                    });

                    // Get the GO facet for the multiple targets
                    var opts = {
                        'facets': 'true',
                        'fields': ['approved_symbol', 'ensembl_gene_id', 'go'],
                        'id': targetIds
                    };
                    var queryObject = {
                        method: 'POST',
                        params: opts
                    };

                    otApi.getTarget(queryObject)
                        .then (function (resp) {
                            scope.showSpinner = false;

                            scope.go = resp.body.facets.significant_go_terms.buckets;

                            // For each aggregated GO term, the api response only gives you
                            // the number of targets in your query associated with that term
                            // we parse the data response to get the actual names
                            var targetsByGo = getTargetsByGo(resp.body.data);

                            $('#target-list-go-terms').DataTable(otUtils.setTableToolsParams({
                                'data': formatGoDataToArray(targetsByGo, scope.go),
                                'ordering': true,
                                'order': [[3, 'desc']],
                                'autoWidth': false,
                                'paging': true,
                                'columnDefs': [
                                    {
                                        targets: [0, 3],
                                        visible: false
                                    }
                                ]

                            }, scope.target.length + '-targets-enriched-go-terms'));

                        });
                })
            }
        };
    }]);
