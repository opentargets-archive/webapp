angular.module('cttvDirectives')

    .directive('multipleTargetsTissuesSummary', ['$log', '$http', '$q', 'otUtils', 'otAPIservice', function ($log, $http, $q, otUtils, otAPIservice) {
        'use strict';

        var tissuesOrdered = [
            'Adipose',
            'Adrenal Gland',
            'Bladder',
            'Brain',
            'Breast',
            'Cells',
            'Cervix',
            'Colon',
            'Esophagus',
            'Fallopian Tube',
            'Heart',
            'Kidney',
            'Liver',
            'Lung',
            'Minor Salivary Gland',
            'Muscle',
            'Nerve',
            'Ovary',
            'Pancreas',
            'Pituitary',
            'Prostate',
            'Skin',
            'Small Intestine',
            'Spleen',
            'Stomach',
            'Testis',
            'Thyroid',
            'Uterus',
            'Vagina',
            'Whole Blood'
        ];

        var tissuesTableCols = [
            {name: '', title: ''}, // first one empty
            {name: '', title: 'Target'}
        ];

        for (var z = 0; z < tissuesOrdered.length; z++) {
            tissuesTableCols.push({
                name: tissuesOrdered[z],
                title: tissuesOrdered[z]
            });
        }
        tissuesTableCols.push({name: '', title: ''}); // last one empty

        var getColorStyleString = function (value, colorScale) {
            var str = '';
            if (value <= 0) {
                str = '<span class=\'no-data\' title=\'No data\'></span>'; // quick hack: where there's no data, don't put anything so the sorting works better
            } else {
                var col = colorScale(value);
                var val = (value === 0) ? '0' : otUtils.floatPrettyPrint(value);
                str = '<span style=\'color: ' + col + '; background: ' + col + ';\' title=\'Score: ' + val + '\'>' + val + '</span>';
            }

            return str;
        };

        // setup the table
        var setupTissuesTable = function (table, data, filename) {
            $(table).DataTable({
                'dom': '<"clearfix" <"clear small" i><"pull-left small" f><"pull-right"<"#cttvTableDownloadIcon">>rt<"pull-left small" l><"pull-right small" p>>',
                'data': data,
                'columns': (function () {
                    var a = [];
                    for (var i = 0; i < tissuesTableCols.length; i++) {
                        a.push({'title': '<div><span title=\'' + tissuesTableCols[i].title + '\'>' + tissuesTableCols[i].title + '</span></div>', 'name': tissuesTableCols[i].name});
                    }
                    return a;
                })(),
                'order': [],
                'orderMulti': true,
                'autoWidth': false,
                'columnDefs': [
                    {
                        'targets': [0, 32],
                        'orderable': false
                    }
                ],
                'ordering': true,
                'lengthMenu': [[20, 100, 500], [20, 100, 500]],
                'pageLength': 20,
                'language': {
                // "lengthMenu": "Display _MENU_ records per page",
                // "zeroRecords": "Nothing found - sorry",
                    'info': 'Showing _START_ to _END_ of _TOTAL_ shared targets'
                // "infoEmpty": "No records available",
                // "infoFiltered": "(filtered from _MAX_ total records)"
                }

            }, filename);
        };


        function parseTissuesData (tissuesData) {
            var newData = [];
            for (var target in tissuesData) {
            // Get the max maxMedian value
                var maxMedianTissue = _.maxBy(_.values(tissuesData[target]), function (o) {
                    return o.maxMedian;
                });
                var maxMedianForTarget = maxMedianTissue.maxMedian;

                var colorScaleOrig = otUtils.colorScales.BLUE_0_1;
                var colorScale = d3.scale.linear()
                    .range(colorScaleOrig.range())
                    .domain([0, maxMedianForTarget]);
                // colorScale.domain([0, maxMedianForTarget]);

                // var row = [];
                var row = ['']; // First one empty
                // Target
                row.push(target);
                for (var i = 0; i < tissuesOrdered.length; i++) {
                    var tissue = tissuesOrdered[i];
                    // Each Tissue
                    // row.push(tissuesData[target][tissue].maxMedian);
                    row.push(getColorStyleString(tissuesData[target][tissue].maxMedian, colorScale));
                }
                row.push(''); // last one empty
                newData.push(row);
            }
            return newData;
        }


        return {
            restrict: 'E',
            templateUrl: 'src/components/multiple-targets/multiple-targets-tissues-summary.html',
            scope: {
                targets: '='
            },
            link: function (scope) {
                scope.$watch('targets', function () {
                    if (!scope.targets) {
                        return;
                    }

                    var gtexPromises = [];
                    var baseGtexUrlPrefix = '/proxy/www.gtexportal.org/api/v6p/expression/';
                    var baseGtexUrlSufix = '?boxplot=true';
                    for (var i = 0; i < scope.targets.length; i++) {
                        var target = scope.targets[i];
                        var targetPromise = otAPIservice.getTarget({
                            method: 'GET',
                            trackCall: true,
                            params: {
                                target_id: target
                            }
                        })
                            .then(function (targetResp) {
                                var symbol = targetResp.body.approved_symbol;
                                var url = baseGtexUrlPrefix + symbol + baseGtexUrlSufix;
                                return $http.get(url)
                                    .then(function (resp) {
                                        return resp;
                                    }, function () {
                                        $log.warn('error... but does not matter');
                                        return;
                                    });
                            });
                        gtexPromises.push(targetPromise);
                    }
                    $q.all(gtexPromises)
                        .then(function (resps) {
                            var tissuesData = {};
                            for (var i = 0; i < resps.length; i++) {
                                var tissues = {};
                                if (resps[i]) {
                                    var parts = resps[i].config.url.split('/');
                                    var target = parts[parts.length - 1].split('?')[0];
                                    for (var fullTissue in resps[i].data.generpkm) {
                                        var d = resps[i].data.generpkm[fullTissue];
                                        var median = d.median;
                                        var tissue = fullTissue.split(' - ')[0];
                                        if (!tissues[tissue]) {
                                            tissues[tissue] = {
                                                target: target,
                                                tissue: tissue,
                                                maxMedian: 0
                                            };
                                        }
                                        if (median > tissues[tissue].maxMedian) {
                                            tissues[tissue].maxMedian = median;
                                        }
                                    }
                                    // var tissuesData = parseTissuesData(_.values(tissues));
                                    tissuesData[target] = tissues;
                                }
                            }
                            var tissueDataRows = parseTissuesData(tissuesData);
                            var table = document.getElementById('tissuesSummaryTargetList');
                            table.innerHTML = '';
                            setupTissuesTable(table, tissueDataRows, 'gtex-data-gene-list.txt');
                        });
                });
            }
        };
    }]);
