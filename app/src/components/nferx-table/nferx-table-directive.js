angular.module('otDirectives')
    .directive('nferxTable', [
        'otApi',
        'otConsts',
        'otClearUnderscoresFilter',
        function (otApi,
                  otConsts,
                  otClearUnderscoresFilter) {
            'use strict';

            var draw = 1;

            function parseServerResponse(data) {
                var newData = [];

                var accessLevelPrivate = "<span class='ot-access-private' title='private data'></span>"; //"<span class='fa fa-users' title='private data'>G</span>";
                var accessLevelPublic = "<span class='ot-access-public' title='public data'></span>"; //"<span class='fa fa-users' title='public data'>P</span>";


                for (var i = 0; i < data.length; i++) {
                    var d = data[i];
                    var row = [];

                    // 0 - Access level
                    row.push(accessLevelPublic);

                    // 1 - Disease label
                    row.push(d.disease.efo_info.label);

                    // 2 - Cosine Distance
                    row.push(d.evidence.resource_score.value.toPrecision(2));

                    // 3 - Document count
                    row.push(d.unique_association_fields.document_count);

                    // 4 - Nferx Url
                    row.push( "<a class='ot-external-link' href='" + d.unique_association_fields.link_url + "' target='_blank'>"
                        + otClearUnderscoresFilter(d.sourceID)
                        + "</a>");


                    newData.push(row);
                }

                return newData;
            }

            var setupTable = function (table, target, disease, filename) {
                return $(table).DataTable({
                    "dom": '<"clearfix" <"clear small" i><"pull-left small" f><"pull-right"B>rt<"pull-left small" l><"pull-right small" p>>',
                    "destroy":true,
                    "buttons": [],
                    'processing': false,
                    'searching': false,
                    'serverSide': true,
                    'autoWidth': false,
                    'ajax': function (data, cbak, params) {
                        // order options
                        // mappings:
                        // 0 => access level(Hidden)
                        // 1 => Disease
                        // 2 => Serial Id
                        // 3 => Pvalue
                        // 4 => Document count
                        // 5 => URL
                        var mappings = {
                            1: "disease.efo_info.label",
                            // 2: "unique_association_fields.serial_id",
                            // 3: "evidence.resource_score.value",
                            // 4: "unique_association_fields.link_url"
                        };

                        // We save the order condition for the server side rendering to use it for the download
                        dirScope.order = [];
                        for (var i = 0; i < data.order.length; i++) {

                            dirScope.order.push( mappings[data.order[i].column]);
                        }

                        var opts = {
                            target: target,
                            disease: disease,
                            datasource: otConsts.dbs.NFERX,
                            size: data.length,
                            from: data.start,
                            sort: dirScope.order,
                            search: data.search.value,
                            draw: draw
                        };
                        var queryObject = {
                            method: 'GET',
                            params: opts
                        };
                        otApi.getFilterBy(queryObject)
                            .then(function (resp) {
                                var dtData = parseServerResponse(resp.body.data);
                                var o = {
                                    recordsTotal: resp.body.total,
                                    recordsFiltered: resp.body.total,
                                    data: dtData,
                                    draw: draw
                                };
                                draw++;
                                cbak(o);
                            });
                    },
                   "ordering": true,
                   "order" : [[1, "asc"]],
                   "orderMulti": false,
                    "columnDefs": [

                       {
                           "targets": [2],
                           "orderable": false
                       },
                        {
                           "targets": [1],
                            "orderSequence": ["asc", "desc"]
                       },
                       {
                           "targets": [3],
                           "orderable": false
                       },
                       {
                           "targets": [0],    // the access-level (public/private icon)
                           "visible": false,
                           "width": "3%"
                       },
                       {
                           "targets": [4],
                           "orderable": false
                       }
                     ]
                }, ( filename + "_nferx"));
            };

            var dirScope;

            return {
                restrict: 'EA',
                templateUrl: 'src/components/nferx-table/nferx-table.html',

                scope: {

                    target: '=',
                    disease: '=',
                    filename: '='
                },
                link: function (scope, elem, attrs) {
                    dirScope = scope;

                    scope.$watchGroup(['total','target', 'disease','filename'], function (vals) {
                        if (!scope.target || !scope.disease ) {
                            return;
                        }
                        // $timeout(function () {
                        //     setupTable(document.getElementById('literature3-table'), scope.target, scope.disease, scope.filename);
                        // }, 0);
                        setupTable(document.getElementById('literature3-table'), scope.target, scope.disease, scope.filename);
                    });


                }
            }
        }])
;
