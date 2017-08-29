/* Directives */
angular.module('otDirectives')


/**
* Matrix (heatmap) view for target associations
*/
    .directive('otTargetAssociationsTable', ['otApi', 'otUtils', 'otDictionary', 'otConsts', '$q', '$analytics', function (otApi, otUtils, otDictionary, otConsts, $q, $analytics) {
        'use strict';

        var whoiam = 'table';
        var draw = 1;
        var filters = {};
        // var nocancers;
        var myscope;

        var colorScale = otUtils.colorScales.BLUE_0_1; // blue orig

        /*
    * Generates and returns the string representation of the span element
    * with color information for each cell
    */
        var getColorStyleString = function (value, href) {
            var str = '';
            if (value < 0) {
                str = '<span class=\'no-data\' title=\'No data\'></span>'; // quick hack: where there's no data, don't put anything so the sorting works better
            /* if(value<0){
                // when there's no data, it should be -1
                str = "<span class='no-data' title='No data'></span>"; // quick hack: where there's no data, don't put anything so the sorting works better
            } else {
                str = "<span class='zero-score' title='Score: 0' style='background:"+colorScale(value)+"'>0</span>"; // this case should be pretty rare
            }*/
            } else {
                var col = colorScale(value);
                var val = (value === 0) ? '0' : otUtils.floatPrettyPrint(value);
                str = '<span style=\'color: ' + col + '; background: ' + col + ';\' title=\'Score: ' + val + '\'>' + val + '</span>';
            }

            if (href && value >= 0) {
                str = '<a href=' + href + '>' + str + '</a>';
            }

            return str;
        };


        var cols = [
            {name: '', title: otDictionary.DISEASE},
            {name: '', title: 'EFO'},
            {name: '', title: 'TherapeuticArea EFO'},
            {name: '', title: otDictionary.ASSOCIATION_SCORE},
            // here are the datatypes:
            {name: otConsts.datatypes.GENETIC_ASSOCIATION, title: otDictionary[otConsts.datatypes.GENETIC_ASSOCIATION.toUpperCase()]},
            {name: otConsts.datatypes.SOMATIC_MUTATION, title: otDictionary[otConsts.datatypes.SOMATIC_MUTATION.toUpperCase()]},
            {name: otConsts.datatypes.KNOWN_DRUG, title: otDictionary[otConsts.datatypes.KNOWN_DRUG.toUpperCase()]},
            {name: otConsts.datatypes.AFFECTED_PATHWAY, title: otDictionary[otConsts.datatypes.AFFECTED_PATHWAY.toUpperCase()]},
            {name: otConsts.datatypes.RNA_EXPRESSION, title: otDictionary[otConsts.datatypes.RNA_EXPRESSION.toUpperCase()]},
            {name: otConsts.datatypes.LITERATURE, title: otDictionary[otConsts.datatypes.LITERATURE.toUpperCase()]},
            {name: otConsts.datatypes.ANIMAL_MODEL, title: otDictionary[otConsts.datatypes.ANIMAL_MODEL.toUpperCase()]},
            {name: '', title: otDictionary.THERAPEUTIC_AREA}
        ];

        /*
    Setup the table cols and return the DT object
    */
        var setupTable = function (table, target, filename, download) {
        // $log.log("setupTable()");
        // return $(table).DataTable( otUtils.setTableToolsParams({
            return $(table).DataTable({
            // "dom": '<"clearfix" <"clear small" i><"pull-left small" f><"pull-right"<"#cttvTableDownloadIcon">>rt<"pull-left small" l><"pull-right small" p>>',
                'dom': '<"clearfix" <"clear small" i><"pull-left small" f><"pull-right"B>rt<"pull-left small" l><"pull-right small" p>>',
                'buttons': [
                    {
                        text: '<span class=\'fa fa-download\' title=\'Download as CSV\'></span>',
                        action: download
                    }
                ],
                'processing': false,
                'serverSide': true,
                'ajax': function (data, cbak) {
                // Order options
                // mappings:
                // 0 => gene name alphabetically -- not supported in the api
                // 1 => gene id alphabetically -- not supported in the api and the column is hidden
                // 2 => overall
                // 3 => genetic_association
                // 4 => somatic_mutation
                // 5 => known_drug
                // 6 => affected_pathway
                // 7 => rna_expression
                // 8 => text_mining
                // 9 => animal_model
                // 10 => overall -- hidden column
                // 11 => gene description -- not supported in the api
                    var mappings = {
                        0: 'disease.efo_info.label',
                        3: 'association_score.overall',
                        4: 'association_score.datatypes.' + otConsts.datatypes.GENETIC_ASSOCIATION,
                        5: 'association_score.datatypes.' + otConsts.datatypes.SOMATIC_MUTATION,
                        6: 'association_score.datatypes.' + otConsts.datatypes.KNOWN_DRUG,
                        7: 'association_score.datatypes.' + otConsts.datatypes.AFFECTED_PATHWAY,
                        8: 'association_score.datatypes.' + otConsts.datatypes.RNA_EXPRESSION,
                        9: 'association_score.datatypes.' + otConsts.datatypes.LITERATURE,
                        10: 'association_score.datatypes.' + otConsts.datatypes.ANIMAL_MODEL,
                        11: 'association_score.overall'
                    };
                    var order = [];
                    for (var i = 0; i < data.order.length; i++) {
                        var prefix = data.order[i].dir === 'asc' ? '~' : '';
                        order.push(prefix + mappings[data.order[i].column]);
                    }

                    var opts = {
                        target: target,
                        outputstructure: 'flat',
                        facets: false,
                        direct: true,
                        size: data.length,
                        from: data.start,
                        sort: order,
                        search: data.search.value,
                        draw: draw
                    };

                    opts = otApi.addFacetsOptions(filters, opts);
                    var queryObject = {
                        method: 'GET',
                        params: opts
                    };

                    otApi.getAssociations(queryObject)
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
                'columns': (function () {
                    var a = [];
                    for (var i = 0; i < cols.length; i++) {
                        a.push({'title': '<div><span title=\'' + cols[i].title + '\'>' + cols[i].title + '</span></div>', name: cols[i].name});
                    }
                    return a;
                })(),
                'columnDefs': [
                    {
                        'targets': [1, 2],
                        'visible': false
                    },
                    {
                        'targets': [3, 4, 5, 6, 7, 8, 9],
                        'asSorting': ['desc', 'asc']
                    },
                    {
                        'orderable': false,
                        'targets': 11
                    },
                    {'orderSequence': ['desc', 'asc'], 'targets': [3, 4, 5, 6, 7, 8, 9, 10, 11]},
                    {'orderSequence': ['asc', 'desc'], 'targets': [0]}
                ],
                'order': [[3, 'desc']],
                'orderMulti': false,
                'autoWidth': false,
                'ordering': true,
                'lengthMenu': [[10, 50, 200, 500], [10, 50, 200, 500]],
                'pageLength': 50
            },
            filename);
        };

        // function excludeCancersFromOtherTAs (dis) {
        //     for (var j = 0; j < dis.efo_info.therapeutic_area.labels.length; j++) {
        //         var ta = dis.efo_info.therapeutic_area.labels[j];
        //         if (ta === 'neoplasm') {
        //             var newCodes = [];
        //             var newLabels = [];
        //             var newPaths = [];
        //
        //             // This disease has neoplasm
        //             // If there are more therapeutic areas, so we need to:
        //             // 1.- Remove any other TA from codes
        //             // 2.- Remove any other TA from labels
        //             // 3.- Remove any path leading to any TA that is not neoplasm
        //             // var neoplasmCode = dis.efo_info.therapeutic_area.codes[j];
        //             var neoplasmCode = "EFO_0000616";
        //             newCodes = [neoplasmCode];
        //             newLabels = ["neoplasm"];
        //             newPaths = [];
        //             for (var k = 0; k < dis.efo_info.path.length; k++) {
        //                 var path = dis.efo_info.path[k];
        //                 if (path[0] === neoplasmCode) {
        //                     newPaths.push(path);
        //                 }
        //             }
        //             dis.efo_info.path = newPaths;
        //             dis.efo_info.therapeutic_area = {
        //                 'codes': newCodes,
        //                 'labels': newLabels
        //             };
        //             break;
        //         }
        //     }
        // }

        function parseServerResponse (d) {
        // scope.n.diseases = resp.total;
            var newData = [];

            // Iterate
            var iterateeEFO = function (str, ta) {
                if (str === '') {
                    str = ta;
                } else {
                    str += ',' + ta;
                }
                return str;
            };

            var iterateeLabel = function (str, ta) {
                if (str === '') {
                    str = ta;
                } else {
                    str += ', ' + ta;
                }
                return str;
            };

            var getScore = function (i, dt) {
                return (!d[i].association_score.datatypes[dt] && !d[i].evidence_count.datatypes[dt]) ? -1 : d[i].association_score.datatypes[dt];
            };

            myscope.filteredOutByExcNeoplasm = 0;

            for (var i = 0; i < d.length; i++) {
                var data = d[i];

                // If the nocancers option is true:
                // if (nocancers === "true") {
                //     // First remove the extra therapeutic areas from the data.
                //     excludeCancersFromOtherTAs(data.disease);
                //
                //     // Then check if the row still has to be there...
                //     var ok = false;
                //
                //     if (filters && filters.therapeutic_area && filters.therapeutic_area.length) {
                //         loop1:
                //         for (var k = 0; k < data.disease.efo_info.therapeutic_area.codes.length; k++) {
                //             var code = data.disease.efo_info.therapeutic_area.codes[k];
                //             for (var f = 0; f < filters.therapeutic_area.length; f++) {
                //                 var fta = filters.therapeutic_area[f].toUpperCase();
                //                 if (fta === code) {
                //                    ok = true;
                //                    break loop1;
                //                 }
                //             }
                //         }
                //     } else {
                //         ok = true;
                //     }
                //     if (!ok) {
                //         myscope.filteredOutByExcNeoplasm++;
                //         continue;
                //     }
                // }

                // No cttv root anymore in the data retrieved by the API
                // if (data.efo_code === "cttv_disease") {
                //     continue;
                // }
                // var datatypes = {};
                // datatypes.genetic_association = _.result(_.find(data.datatypes, function (d) { return d.datatype === "genetic_association"; }), "association_score")||0;
                // datatypes.somatic_mutation = _.result(_.find(data.datatypes, function (d) { return d.datatype === "somatic_mutation"; }), "association_score")||0;
                // datatypes.known_drug = _.result(_.find(data.datatypes, function (d) { return d.datatype === "known_drug"; }), "association_score")||0;
                // datatypes.affected_pathway = _.result(_.find(data.datatypes, function (d) { return d.datatype === "affected_pathway"; }), "association_score")||0;
                // datatypes.rna_expression = _.result(_.find(data.datatypes, function (d) { return d.datatype === "rna_expression"; }), "association_score")||0;
                // datatypes.literature = _.result(_.find(data.datatypes, function (d) { return d.datatype === "literature"; }), "association_score")||0;
                // datatypes.animal_model = _.result(_.find(data.datatypes, function (d) { return d.datatype === "animal_model"; }), "association_score")||0;
                var datatypes = data.association_score.datatypes;
                var row = [];

                // Disease name
                var geneDiseaseLoc = '/evidence/' + data.target.id + '/' + data.disease.id;

                row.push('<a href=\'' + geneDiseaseLoc + '\' title=\'' + data.disease.efo_info.label + '\'>' + data.disease.efo_info.label + '</a>');

                // EFO (hidden)
                row.push(data.disease.id);

                // TherapeuticArea EFO (hidden)
                var taStr = _.reduce(data.disease.efo_info.therapeutic_area.codes, iterateeEFO, '');
                row.push(taStr); // Neoplasm

                // Association score
                row.push(getColorStyleString(data.association_score.overall, geneDiseaseLoc));

                // Genetic association
                row.push(getColorStyleString(getScore(i, 'genetic_association'), geneDiseaseLoc + (geneDiseaseLoc.indexOf('?') === -1 ? '?' : '&') + 'view=sec:genetic_associations'));
                // Somatic mutation
                row.push(getColorStyleString(getScore(i, 'somatic_mutation'), geneDiseaseLoc +    (geneDiseaseLoc.indexOf('?') === -1 ? '?' : '&') + 'view=sec:somatic_mutations'));
                // Known drug
                row.push(getColorStyleString(getScore(i, 'known_drug'), geneDiseaseLoc +          (geneDiseaseLoc.indexOf('?') === -1 ? '?' : '&') + 'view=sec:known_drugs'));
                // Affected pathway
                row.push(getColorStyleString(getScore(i, 'affected_pathway'), geneDiseaseLoc +    (geneDiseaseLoc.indexOf('?') === -1 ? '?' : '&') + 'view=sec:affected_pathways'));
                // Expression atlas
                row.push(getColorStyleString(getScore(i, 'rna_expression'), geneDiseaseLoc +      (geneDiseaseLoc.indexOf('?') === -1 ? '?' : '&') + 'view=sec:rna_expression'));
                // Literature
                row.push(getColorStyleString(getScore(i, 'literature'), geneDiseaseLoc +            (geneDiseaseLoc.indexOf('?') === -1 ? '?' : '&') + 'view=sec:literature'));
                // Animal model
                row.push(getColorStyleString(getScore(i, 'animal_model'), geneDiseaseLoc +        (geneDiseaseLoc.indexOf('?') === -1 ? '?' : '&') + 'view=sec:animal_models'));
                // Therapeutic area
                var area = _.reduce(data.disease.efo_info.therapeutic_area.labels, iterateeLabel, '');
                row.push('<span title=\'' + area + '\'>' + area + '</span>');

                newData.push(row);
            }

            return newData;
        }

        return {

            restrict: 'E',

            scope: {
                target: '=',
                // nocancers: '@',
                loadprogress: '=',
                filename: '=',
                facets: '=',
                active: '@'
            },


            template: '<div>'
        // + ' <div class="clearfix"><div class="pull-right"><a class="btn btn-default buttons-csv buttons-html5" ng-click="downloadTable()"><span class="fa fa-download" title="Download as CSV"></span></a></div></div>'
        // +'<h5 ng-show="filteredOutByExcNeoplasm>0">Filtered out {{filteredOutByExcNeoplasm}} neoplasm diseases from other therapeutic areas</h5>'
        + '<div></div>'
        + '<ot-matrix-table></ot-matrix-table>'
        + '<ot-matrix-legend colors="legendData"></ot-matrix-legend>'
        + '<ot-matrix-legend legend-text="legendText" colors="colors" layout="h"></ot-matrix-legend>'
        + '</div>',


            link: function (scope, elem) {
            // Making the scope accessible in the table processing
                myscope = scope;

                // -----------------------
                // Initialize table etc
                // -----------------------

                // table itself
                // var table = elem.children().eq(0)[0];
                var table = elem.children().eq(0).children().eq(1)[0];
                var dtable;
                // var dtable = setupTable(table, scope.filename);

                // legend stuff
                // scope.labs = ["a","z"];
                scope.legendText = 'Score';
                scope.colors = [];
                for (var i = 0; i <= 100; i += 25) {
                    var j = i / 100;
                    // scope.labs.push(j);
                    scope.colors.push({color: colorScale(j), label: j});
                }
                scope.legendData = [
                    {label: 'No data', class: 'no-data'}
                ];

                // Download the whole table
                scope.downloadTable = function () {
                    var size = 10000;
                    // First make a call to know how many rows there are:
                    var optsPreFlight = {
                        target: scope.target,
                        outputstructure: 'flat',
                        facets: false,
                        size: 1
                    };
                    optsPreFlight = otApi.addFacetsOptions(scope.facets, optsPreFlight);
                    var queryObject = {
                        method: 'GET',
                        params: optsPreFlight
                    };
                    otApi.getAssociations(queryObject)
                        .then(function (resp) {
                            var total = resp.body.total;

                            function columnsNumberOk (csv, n) {
                                var firstRow = csv.split('\n')[0];
                                var cols = firstRow.split(',');
                                return cols.length === n;
                            }

                            function getNextChunk (size, from) {
                                var opts = {
                                    target: scope.target,
                                    outputstructure: 'flat',
                                    facets: false,
                                    format: 'csv',
                                    size: size,
                                    direct: true,
                                    fields: ['disease.efo_info.label', 'association_score.overall', 'association_score.datatypes.genetic_association', 'association_score.datatypes.somatic_mutation', 'association_score.datatypes.known_drug', 'association_score.datatypes.affected_pathway', 'association_score.datatypes.rna_expression', 'association_score.datatypes.literature', 'association_score.datatypes.animal_model', 'disease.efo_info.therapeutic_area.labels'],
                                    from: from
                                };
                                opts = otApi.addFacetsOptions(scope.facets, opts);

                                var queryObject = {
                                    method: 'GET',
                                    params: opts
                                };
                                return otApi.getAssociations(queryObject)
                                    .then(function (resp) {
                                        var moreText = resp.body;
                                        if (columnsNumberOk(moreText, opts.fields.length)) {
                                            if (from > 0) {
                                            // Not in the first page, so remove the header row
                                                moreText = moreText.split('\n').slice(1).join('\n');
                                            }
                                            totalText += moreText;
                                            return totalText;
                                        }
                                    });
                            }

                            var promise = $q(function (resolve, reject) {
                                resolve('');
                            });
                            var totalText = '';
                            var promises = [];
                            for (var i = 0; i < total; i += size) {
                                promises.push({
                                    from: i,
                                    total: size
                                });
                            // promises.push(getNextChunk(size, i));
                            }
                            promises.forEach(function (p) {
                                promise = promise.then(function () {
                                    return getNextChunk(p.total, p.from);
                                });
                            });
                            promise.then(function () {
                                var b = new Blob([totalText], {type: 'text/csv;charset=utf-8'});
                                saveAs(b, scope.filename + '.csv');
                            // var hiddenElement = document.createElement('a');
                            // hiddenElement.href = 'data:application/csv:charset=utf-8,' + encodeURI(totalText);
                            // hiddenElement.target = '_blank';
                            // hiddenElement.download = scope.filename + ".csv";
                            // hiddenElement.click();
                            });
                        }, otApi.defaultErrorHandler);
                };

                scope.$watchGroup(['facets', 'target', 'active'], function () {
                // nocancers = scope.nocancers;
                    filters = scope.facets;
                    if (scope.active !== whoiam) {
                        return;
                    }

                    if (dtable) {
                        dtable.ajax.reload();
                    } else {
                    // Fire a target associations tree event for piwik to track
                        $analytics.eventTrack('targetAssociationsTable', {'category': 'association', 'label': 'table'});
                        dtable = setupTable(table, scope.target, scope.filename, scope.downloadTable);
                    }
                });
            } // end link

        }; // end return
    }]);    // end directive otTargetAssociationsTable
