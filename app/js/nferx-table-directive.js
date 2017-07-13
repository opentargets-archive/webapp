angular.module('cttvDirectives')
    .directive('nferxtable', ['$log',
        'cttvAPIservice',
        'cttvUtils',
        '$timeout',
        'cttvConfig',
        'cttvConsts',
        'cttvDictionary',
        'upperCaseFirstFilter',
        'clearUnderscoresFilter',
        '$q',
        function ($log,
                  cttvAPIservice,
                  cttvUtils,
                  $timeout,
                  cttvConfig,
                  cttvConsts,
                  cttvDictionary,
                  upperCaseFirst,
                  clearUnderscores,
                  $q) {
            'use strict';

            var draw = 1;




            function parseServerResponse(data) {
                var newData = [];

                var accessLevelPrivate = "<span class='cttv-access-private' title='private data'></span>"; //"<span class='fa fa-users' title='private data'>G</span>";
                var accessLevelPublic = "<span class='cttv-access-public' title='public data'></span>"; //"<span class='fa fa-users' title='public data'>P</span>";


                for (var i = 0; i < data.length; i++) {
                    var d = data[i];
                    var row = [];

                    // 0 - Access level
                    row.push((d.access_level == cttvConsts.ACCESS_LEVEL_PUBLIC) ? accessLevelPublic : accessLevelPrivate);

                    // 1 - Disease label
                    row.push(d.disease.efo_info.label);

                    // 2 - Nferx Serial Id
                    row.push(d.unique_association_fields.serial_id);

                    // 3 - P-value
                    row.push(d.evidence.resource_score.value);

                    // 4 - Nferx Url
                    row.push(d.unique_association_fields.link_url);


                    newData.push(row);
                }

                return newData;
            }

            var setupTable = function (table, target, disease) {
                return $(table).DataTable({
                    "dom": '<"clearfix" <"clear small" i><"pull-left small" f><"pull-right"B>rt<"pull-left small" l><"pull-right small" p>>',

                    'processing': false,
                    'searching': false,
                    'serverSide': true,
                    'autoWidth': false,
                    'ajax': function (data, cbak, params) {
                        // order options
                        // mappings:
                        // 0 => access level
                        // 1 => Disease
                        // 2 => Pubmed Id (hidden)
                        // 3 => Abstract
                        // 4 => Year
                        // 5 => Title (hidden -- used for export)
                        // 6 => Authors (hidden -- used for export)
                        // 7 => Journal (hidden -- used for export)
                        // 8 => Abstract (hidden -- used for export)
                        // 9 => Matches (hidden -- used for export)
                        // 10 => URL (hidden -- used for export)
                        var mappings = {
                            1: "disease.efo_info.label",
                            2: "unique_association_fields.serial_id"
                            3: "evidence.resource_score.value"
                            4: "unique_association_fields.link_url"
                        };

                        // We save the order condition for the server side rendering to use it for the download
                        dirScope.order = [];
                        for (var i = 0; i < data.order.length; i++) {
                            var prefix = data.order[i].dir === 'asc' ? '~' : '';
                            dirScope.order.push(prefix + mappings[data.order[i].column]);
                        }

                        var opts = {
                            target: target,
                            disease: disease,
                            datasource: cttvConfig.evidence_sources.literature[1],
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
                        cttvAPIservice.getFilterBy(queryObject)
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
//                    "ordering": true,
//                    "order" : [[4, "desc"]],
//                    "orderMulti": false,
//                    "columnDefs": [
//                        {
//                            "targets": [2, 5, 6, 7, 8, 9, 10],
//                            "visible": false
//                        },
//                        {
//                            "targets": [4],
//                            "orderSequence": ["desc", "asc"]
//                        },
//                        {
//                            "targets": [1],
//                            "orderSequence": ["asc", "desc"]
//                        },
//                        {
//                            "targets": [3],
//                            "orderable": false
//                        },
//                        {
//                            "targets": [0],    // the access-level (public/private icon)
//                            "visible": cttvConfig.show_access_level,
//                            "width": "3%"
//                        },
//                        {
//                            "targets": [1], //disease?
//                            "width": "12%"
//                        }
//                    ]
                }, (filename + "-text_mining"));
            };

            var dirScope;

            return {
                restrict: 'EA',
                templateUrl: 'partials/nferx-table.html',
                scope: {
                    target: '=',
                    disease: '='
                },
                link: function (scope, elem, attrs) {
                    dirScope = scope;
//                    scope.openNferx = function (pmid) {
//                        var URL = "http://europepmc.org/abstract/MED/" + pmid;
//                        window.open(URL);
//                    };
//
//                    scope.displaySentences = function (id) {
//                        //make the collapse content to be shown or hide
//                        $('#' + id).toggle("fast");
//                    };

                    scope.$watchGroup(['target', 'disease'], function (vals) {
                        if (!scope.target || !scope.disease ) {
                            return;
                        }
                        $timeout(function () {
                            setupTable(document.getElementById('literature3-table'), scope.target, scope.disease);
                        }, 0);
                        // setupTable();
                    });


                }
            }
        }])
;