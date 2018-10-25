/* Directives */
angular.module('otDirectives')


/**
*
* Options for configuration are:
*   filename: the string to be used as filename when exporting the directive table to excel or pdf; E.g. "targets_associated_with_BRAF"
*   loadprogress: the name of the var in parent scope to be used as flag for API call progress update. E.g. laodprogress="loading"
*
* Example:
*   <ot-disease-associations target="{{search.query}}" filename="targets_associated_with_BRAF" loadprogress="loading"></ot-disease-associations>
*
*   In this example, "loading" is the name of the var in the parent scope, pointing to $scope.loading.
*   This is useful in conjunction with a spinner where you can have ng-show="loading"
*/
    .directive('otDiseasePrioritisation', ['otUtils', 'otDictionary', 'otConsts', 'otApi', function (otUtils, otDictionary, otConsts, otApi) {
        'use strict';


        // Columns:
        // 0 => gene name
        // 1 => overall

        // Datatypes:
        // 2 => genetic_association
        // 3 => somatic_mutation
        // 4 => known_drug
        // 5 => affected_pathway
        // 6 => rna_expression
        // 7 => text_mining
        // 8 => animal_model

        // Tractability:
        // 9 => small molecule
        // 10 => antibody
        // 11 => other target attributes

        var checkPath = otUtils.checkPath;
        var filters = {};
        var targets;
        var noDataHtmlString = '<span class="no-data cell-background" title="No data"></span>';

        var colorScale = otUtils.colorScales.BLUE_0_1; // blue orig
        // var colorScale = d3.interpolateYlGnBu;

        // Controls pagination in datatables [Prev | Next] with the Next index
        // indexes contains an array of the indexes for all previous pages and the next one
        // currStart is needed to know if we are going forward (next) or backwards (prev).
        // currLength stores the current number of rows per page (this is needed because we revert to page 0 if this changes).
        var draw = 1;
        var indexes = [];
        var currStart = 0;
        var currLength;

        var state = {};

        /*
         * Generates and returns the string representation of the span element
         * with color information for each cell
         */
        var getColorStyleString = function (value, href) {
            var str = '';
            if (value < 0) {
                str = noDataHtmlString; // quick hack: where there's no data, don't put anything so the sorting works better
            } else {
                var col = colorScale(value);
                var val = (value === 0) ? '0' : otUtils.floatPrettyPrint(value);
                str = '<span class=\'cell-background\' style=\'background: ' + col + ';\' title=\'Score: ' + val + '\'><span class="heatmap-cell-val">' + val + '</span></span>';

                if (href) {
                    str = '<a href=' + href + '>' + str + '</a>';
                }
            }

            // wrap in container span
            str = '<span>' + str + '</span>';

            return str;
        };


        /*
         * Columns definitions
         */
        var cols = [
            // overview: 0-1
            {
                name: '',
                title: otDictionary.TARGET_SYMBOL
            },
            {
                name: '',
                title: otDictionary.ASSOCIATION_SCORE
            },

            // here are the datatypes 2-8:
            {
                name: otConsts.datatypes.GENETIC_ASSOCIATION.id,
                title: otDictionary[otConsts.datatypes.GENETIC_ASSOCIATION.id.toUpperCase()]
            },
            {
                name: otConsts.datatypes.SOMATIC_MUTATION.id,
                title: otDictionary[otConsts.datatypes.SOMATIC_MUTATION.id.toUpperCase()]
            },
            {
                name: otConsts.datatypes.KNOWN_DRUG.id,
                title: otDictionary[otConsts.datatypes.KNOWN_DRUG.id.toUpperCase()]
            },
            {
                name: otConsts.datatypes.AFFECTED_PATHWAY.id,
                title: otDictionary[otConsts.datatypes.AFFECTED_PATHWAY.id.toUpperCase()]
            },
            {
                name: otConsts.datatypes.RNA_EXPRESSION.id,
                title: otDictionary[otConsts.datatypes.RNA_EXPRESSION.id.toUpperCase()]
            },
            {
                name: otConsts.datatypes.LITERATURE.id,
                title: otDictionary[otConsts.datatypes.LITERATURE.id.toUpperCase()]
            },
            {
                name: otConsts.datatypes.ANIMAL_MODEL.id,
                title: otDictionary[otConsts.datatypes.ANIMAL_MODEL.id.toUpperCase()]
            },

            // tractability 9-10
            {
                name: '',
                title: 'Small molecule<br />tractability data'
            },
            {
                name: '',
                title: 'Antibody<br />tractability data'
            }
            // TODO: this is for later version / release of tractability
            // {
            //     name: '',
            //     title: 'other target attributes'
            // }
        ];


        var getHiddenDatatypesCols = function () {
            var hc = [];
            if (filters.datatype) {
                cols.forEach(function (c, i) {
                    if (i > 1 && i < 9 && filters.datatype.indexOf(c.name) === -1) {
                        hc.push(i);
                    }
                });
            }
            return hc;
        };


        /*
         * Setup the table cols and return the DT object
         */
        var setupTable = function (table, disease, target, filename, download) {
            var t = $(table).DataTable({
                'destroy': true,
                'pagingType': 'simple',
                'dom': '<"clearfix" <"clear small" i><"pull-left small" f><"pull-right" B>>rt<"clearfix" <"pull-left small" l><"pull-right small" p>>',
                'buttons': [
                    {
                        text: '<span title="Download as .csv"><span class="fa fa-download"></span> Download .csv</span>',
                        action: download
                    }
                ],
                'columnDefs': [
                    {'orderSequence': ['desc', 'asc'], 'targets': [1, 2, 3, 4, 5, 6, 7, 8]},
                    {'orderSequence': ['asc', 'desc'], 'targets': [0]},
                    {
                        'targets': getHiddenDatatypesCols(),
                        'visible': false
                    },
                    {
                        'targets': [2, 3, 4, 5, 6, 7, 8],
                        'width': '7%'   // TODO: this doesn't seem to work when multi-row thead used
                    },
                    {
                        'targets': [9, 10],
                        'orderable': false
                    }
                ],
                'processing': false,
                'serverSide': true,
                'ajax': function (data, cbak) {
                    if (!currLength) {
                        currLength = data.length;
                    }
                    if (data.length !== currLength) {
                        data.start = 0;
                        currLength = data.length;
                        indexes = [];
                        if (t) {
                            t.page('first');
                        }
                    }
                    // Order options
                    // mappings:
                    var mappings = {
                        0: 'target.gene_info.symbol',
                        1: 'association_score.overall',
                        2: 'association_score.datatypes.' + otConsts.datatypes.GENETIC_ASSOCIATION.id,
                        3: 'association_score.datatypes.' + otConsts.datatypes.SOMATIC_MUTATION.id,
                        4: 'association_score.datatypes.' + otConsts.datatypes.KNOWN_DRUG.id,
                        5: 'association_score.datatypes.' + otConsts.datatypes.AFFECTED_PATHWAY.id,
                        6: 'association_score.datatypes.' + otConsts.datatypes.RNA_EXPRESSION.id,
                        7: 'association_score.datatypes.' + otConsts.datatypes.LITERATURE.id,
                        8: 'association_score.datatypes.' + otConsts.datatypes.ANIMAL_MODEL.id
                    };
                    var order = [];
                    for (var i = 0; i < data.order.length; i++) {
                        var prefix = data.order[i].dir === 'asc' ? '~' : '';
                        order.push(prefix + mappings[data.order[i].column]);
                    }

                    // TODO: put this back if we put the state back
                    // data.start = stt.p*data.length || data.start;   // NaN || data.start in case it's not defined
                    var searchValue = (data.search.value).toLowerCase();

                    var opts = {
                        disease: [disease],
                        facets: false,
                        size: data.length,
                        // from: data.start,
                        sort: order,
                        search: searchValue,
                        draw: draw
                    };

                    var currPage = data.start / data.length;

                    // Control pagination
                    if (data.start > currStart) {
                        // We are moving forward...
                        opts.next = indexes[currPage];
                    } else if (data.start < currStart) {
                        // We are moving backwards...
                        opts.next = indexes[currPage];
                    }

                    // Restrict the associations to these targets
                    if (target && target.length) {
                        opts.target = target;
                    }

                    opts = otApi.addFacetsOptions(filters, opts);
                    var queryObject = {
                        method: 'POST',
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

                            // To control pagination
                            // indexes[currPage + 1] = resp.body.data[resp.body.data.length - 1].search_metadata.sort;
                            indexes[currPage + 1] = resp.body.next;
                            currStart = data.start;

                            draw++;
                            cbak(o);
                        });
                },

                // "order" : [[2, "desc"], [10, "desc"]],
                'order': [1, 'desc'],   // stt.o || [2, "desc"],
                'orderMulti': false,
                'autoWidth': false,
                'ordering': true,
                'lengthMenu': [[10, 50, 200, 500], [10, 50, 200, 500]],
                'pageLength': 50,
                'language': {
                    // "lengthMenu": "Display _MENU_ records per page",
                    // "zeroRecords": "Nothing found - sorry",
                    'info': 'Showing _START_ to _END_ of _TOTAL_ targets'
                    // "infoEmpty": "No records available",
                    // "infoFiltered": "(filtered from _MAX_ total records)"
                }
                // "aoColumns": [
                //    { "asSorting": [ "desc", "asc" ] }, //first sort desc, then asc
                // ]
            }, filename);

            return t;
        };

        function parseServerResponse (data) {
            var newData = new Array(data.length);

            var getScore = function (d, dt) {
                return (!data[d].association_score.datatypes[dt] && !data[d].evidence_count.datatypes[dt]) ? -1 : data[d].association_score.datatypes[dt];
            };

            for (var i = 0; i < data.length; i++) {
                var row = [];

                // Overview:

                // Target
                var geneDiseaseLoc = '/evidence/' + data[i].target.id + '/' + data[i].disease.id;
                row.push('<a href=\'' + geneDiseaseLoc + '\' title=\'' + data[i].target.gene_info.symbol + '\'>' + data[i].target.gene_info.symbol + '</a>');

                // The association score
                row.push(getColorStyleString(data[i].association_score.overall, geneDiseaseLoc));

                // Datatypes:

                for (var j = 2; j <= 8; j++) {
                    row.push(
                        '<span class="prioritisation-datatype">'
                        + getColorStyleString(getScore(i, cols[j].name), geneDiseaseLoc + (geneDiseaseLoc.indexOf('?') === -1 ? '?' : '&') + 'view=sec:' + cols[j].name)
                        + '</span>'
                    );
                }

                // Tractability stuff

                // Small molecules
                var sm = '<span>' + noDataHtmlString + '</span>';
                if (checkPath(data[i], 'target.tractability.smallmolecule.buckets') && data[i].target.tractability.smallmolecule.buckets.length > 0) {
                    sm = '<span><span class="cell-background tractable"><span class="heatmap-cell-val">1</span></span></span>';
                }
                row.push(sm);

                // Antibody
                var ab = '<span>' + noDataHtmlString + '</span>';
                if (checkPath(data[i], 'target.tractability.antibody.buckets') && data[i].target.tractability.antibody.buckets.length > 0) {
                    ab = '<span><span class="cell-background tractable"><span class="heatmap-cell-val">1</span></span></span>';
                }
                row.push(ab);

                // Other target attributes
                // TODO: put this back when we have data
                // row.push('<span>' + noDataHtmlString + '</span>');

                newData[i] = row;
            }
            return newData;
        }


        return {
            restrict: 'E',

            scope: {
                filename: '=',
                targets: '=',
                disease: '=',
                filters: '=',
                stateId: '@?'
            },

            templateUrl: 'src/components/disease-prioritisation/disease-prioritisation.html',

            link: function (scope, elem) {
                // table itself
                // var table = elem.children().eq(0).children().eq(0)[0];
                var table = elem[0].getElementsByTagName('table');
                var dtable;

                // legend stuff
                scope.legendText = 'Score';
                scope.colors = [];
                scope.cols = cols;

                for (var i = 0; i <= 100; i += 25) {
                    var j = i / 100;
                    scope.colors.push({color: colorScale(j), label: j});
                }
                scope.legendData = [
                    {label: 'No data', class: 'no-data'}
                ];

                scope.stateId = scope.stateId || 'dhm'; // Disease Heat Map ??

                // Download the whole table
                scope.downloadTable = function () {
                    var size = 10000;
                    var totalText = '';
                    function columnsNumberOk (csv, n) {
                        var firstRow = csv.split('\n')[0];
                        var cols = firstRow.split(',');

                        return cols.length === n;
                    }

                    function getNextChunk (nextIndex) {
                        var opts = {
                            disease: [scope.disease],
                            facets: false,
                            format: 'csv',
                            size: size,
                            fields: [
                                'target.gene_info.symbol',
                                'target.id',
                                'association_score.overall',
                                'association_score.datatypes.genetic_association',
                                'association_score.datatypes.somatic_mutation',
                                'association_score.datatypes.known_drug',
                                'association_score.datatypes.affected_pathway',
                                'association_score.datatypes.rna_expression',
                                'association_score.datatypes.literature',
                                'association_score.datatypes.animal_model',
                                // tractability info
                                // TODO: this would ideally need some re-working to show 'yes' or 'true' instead of list of buckets
                                'target.tractability.smallmolecule.buckets',
                                'target.tractability.antibody.buckets'
                            ]
                            // from: from
                        };
                        if (scope.targets && scope.targets.length) {
                            opts.target = scope.targets;
                        }

                        if (nextIndex) {
                            opts.next = nextIndex;
                        }

                        opts = otApi.addFacetsOptions(scope.filters, opts);

                        var queryObject = {
                            method: 'POST',
                            params: opts
                        };

                        return otApi.getAssociations(queryObject)
                            .then(function (resp) {
                                var moreText = resp.body;

                                if (columnsNumberOk(moreText, opts.fields.length)) {
                                    if (nextIndex) {
                                        // Not in the first page, so remove the header row
                                        moreText = moreText.split('\n').slice(1).join('\n');
                                    }
                                    totalText += moreText;
                                }
                            });
                    }

                    function getNextIndex (nextIndex) {
                        var opts = {
                            disease: [scope.disease],
                            facets: false,
                            size: size,
                            fields: ['thisfielddoesnotexist'] // only interested in the next index
                        };

                        if (nextIndex) {
                            opts.next = nextIndex;
                        }

                        opts = otApi.addFacetsOptions(scope.filters, opts);

                        var queryObject = {
                            method: 'POST',
                            params: opts
                        };

                        return otApi.getAssociations(queryObject)
                            .then(function (resp) {
                                return resp.body.next;
                            });
                    }

                    // Makes 2 calls to the api,
                    // The first one to take the next data (in csv)
                    // The second one to take the next index
                    function callNext (nextIndex) {
                        getNextChunk(nextIndex)
                            .then(function () {
                                return getNextIndex(nextIndex)
                                    .then(function (nextNext) {
                                        if (nextNext) {
                                            callNext(nextNext);
                                        } else {
                                            var b = new Blob([totalText], {type: 'text/csv;charset=utf-8'});
                                            saveAs(b, scope.filename + '.csv');
                                        }
                                    });
                            });
                    }

                    callNext();
                };


                // TODO: check this
                // Do we want the directive to listen for changes in the URL?
                // scope.$on(otLocationState.STATECHANGED, function (evt, new_state, old_state) {
                //     render( new_state, old_state ); // if there are no facets, no worries, the API service will handle undefined
                // });

                scope.$watchGroup(['filters', 'disease', 'targets'], function (attrs) {
                    filters = attrs[0] || [];
                    targets = attrs[2];

                    dtable = setupTable(table, scope.disease, scope.targets, scope.filename, scope.downloadTable, state);

                    // listener for page changes
                    dtable.on('page.dt', function () {
                        // TODO: comment back in when (if) ready
                        // state.p = +dtable.page.info().page;
                        // update(scope.stateId, state);
                    });

                    // listener for order change
                    dtable.on('order.dt', function () {
                        // TODO: comment back in when (if) ready
                        // var order = dtable.order();
                        // if( !Array.isArray(order[0])){
                        //     order = [order];
                        // }
                        // state.o = order[0];
                        // update(scope.stateId, state);
                    });
                }); // end watchGroup
            } // end link
        }; // end return
    }]);
