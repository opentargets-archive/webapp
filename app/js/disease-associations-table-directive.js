/* Directives */
angular.module('cttvDirectives')


/**
*
* Options for configuration are:
*   filename: the string to be used as filename when exporting the directive table to excel or pdf; E.g. "targets_associated_with_BRAF"
*   loadprogress: the name of the var in parent scope to be used as flag for API call progress update. E.g. laodprogress="loading"
*
* Example:
*   <cttv-disease-associations target="{{search.query}}" filename="targets_associated_with_BRAF" loadprogress="loading"></cttv-disease-associations>
*
*   In this example, "loading" is the name of the var in the parent scope, pointing to $scope.loading.
*   This is useful in conjunction with a spinner where you can have ng-show="loading"
*/
.directive('cttvDiseaseAssociations', ['$log', 'cttvUtils', 'cttvDictionary', 'cttvFiltersService', 'cttvConsts', 'cttvAPIservice', '$q', 'cttvLocationState', function ($log, cttvUtils, cttvDictionary, cttvFiltersService, cttvConsts, cttvAPIservice, $q, cttvLocationState) {

    'use strict';

    var draw = 1;
    var filters = {};
    var targets;

    var colorScale = cttvUtils.colorScales.BLUE_0_1; //blue orig

    var state = {};

    /*
     * Generates and returns the string representation of the span element
     * with color information for each cell
     */
    var getColorStyleString = function (value, href) {
        var str = "";
        if (value <= 0) {
            str = "<span class='no-data' title='No data'></span>"; // quick hack: where there's no data, don't put anything so the sorting works better
        } else {
            var col = colorScale(value);
            var val = (value === 0) ? "0" : cttvUtils.floatPrettyPrint(value);
            str = "<span style='color: " + col + "; background: " + col + ";' title='Score: " + val + "'>" + val + "</span>";
        }

        if (href && (value >= 0)) {
            str = "<a href=" + href + ">" + str + "</a>";
        }

        return str;
    };


    /*
     * Columns definitions
     */
    var cols = [
        // empty col for the gene symbol
        {name: "", title: cttvDictionary.TARGET_SYMBOL},
        //{name: "", title: cttvDictionary.ENSEMBL_ID},
        {name: "", title: cttvDictionary.ASSOCIATION_SCORE},
        // here are the datatypes:
        {
            name: cttvConsts.datatypes.GENETIC_ASSOCIATION,
            title: cttvDictionary[cttvConsts.datatypes.GENETIC_ASSOCIATION.toUpperCase()]
        },
        {
            name: cttvConsts.datatypes.SOMATIC_MUTATION,
            title: cttvDictionary[cttvConsts.datatypes.SOMATIC_MUTATION.toUpperCase()]
        },
        {
            name: cttvConsts.datatypes.KNOWN_DRUG,
            title: cttvDictionary[cttvConsts.datatypes.KNOWN_DRUG.toUpperCase()]
        },
        {
            name: cttvConsts.datatypes.AFFECTED_PATHWAY,
            title: cttvDictionary[cttvConsts.datatypes.AFFECTED_PATHWAY.toUpperCase()]
        },
        {
            name: cttvConsts.datatypes.RNA_EXPRESSION,
            title: cttvDictionary[cttvConsts.datatypes.RNA_EXPRESSION.toUpperCase()]
        },
        {
            name: cttvConsts.datatypes.LITERATURE,
            title: cttvDictionary[cttvConsts.datatypes.LITERATURE.toUpperCase()]
        },
        {
            name: cttvConsts.datatypes.ANIMAL_MODEL,
            title: cttvDictionary[cttvConsts.datatypes.ANIMAL_MODEL.toUpperCase()]
        },
        // empty col for sorting by total score (sum)
        {name: "", title: "total score", visible:false, className:'never'},
        // empty col for the gene name
        {name: "", title: cttvDictionary.TARGET_NAME}
    ];

        var a = [];
        for (var i = 0; i < cols.length; i++) {
            var columnData = {
                "title": "<div><span title='" + cols[i].title + "'>" + cols[i].title + "</span></div>",
                "name": cols[i].name
            }
            if (i == 9){
                columnData = {
                    "title": "<div><span title='" + cols[i].title + "'>" + cols[i].title + "</span></div>",
                    "name": cols[i].name,
                    "visible" : false,
                    "className":"never"
                }
            }
            a.push(columnData);
        }





    /*
    Setup the table cols and return the DT object
    */
    var setupTable = function (table, disease, target, filename, download, stt) {
        stt = stt || {};

        var t = $(table).DataTable({
            "destroy": true,
            "dom": '<"clearfix" <"clear small" i><"pull-left small" f><"pull-right"B>rt<"pull-left small" l><"pull-right small" p>>',
            "buttons": [
                {
                    text: "<span class='fa fa-download' title='Download as CSV'></span>",
                    action: download
                }
            ],
            "columns": a,
            "columnDefs": [
                {
                    "targets":[9],
                    "className":"never"
                },
                {
                    "targets": 9,
                    "visible": false
                },
                {
                    "targets": [10],
                    "orderable": false
                },
                {"orderSequence": ["desc", "asc"], "targets": [1, 2, 3, 4, 5, 6, 7, 8, 9]},
                {"orderSequence": ["asc", "desc"], "targets": [0]}
            ],
            "processing": false,
            "serverSide": true,
            "ajax": function (data, cbak, params) {

                // Order options
                // mappings:
                // 0 => gene name alphabetically -- not supported in the api

                // 1 => overall
                // 2 => genetic_association
                // 3 => somatic_mutation
                // 4 => known_drug
                // 5 => affected_pathway
                // 6 => rna_expression
                // 7 => text_mining
                // 8 => animal_model
                // 9 => overall -- hidden column
                // 10 => gene description -- not supported in the api
                var mappings = {
                    0: "target.gene_info.symbol",
                    1: "association_score.overall",
                    2: "association_score.datatypes." + cttvConsts.datatypes.GENETIC_ASSOCIATION,
                    3: "association_score.datatypes." + cttvConsts.datatypes.SOMATIC_MUTATION,
                    4: "association_score.datatypes." + cttvConsts.datatypes.KNOWN_DRUG,
                    5: "association_score.datatypes." + cttvConsts.datatypes.AFFECTED_PATHWAY,
                    6: "association_score.datatypes." + cttvConsts.datatypes.RNA_EXPRESSION,
                    7: "association_score.datatypes." + cttvConsts.datatypes.LITERATURE,
                    8: "association_score.datatypes." + cttvConsts.datatypes.ANIMAL_MODEL,
                    9: "association_score.overall"
                };
                var order = [];
                for (var i=0; i<data.order.length; i++) {
                    var prefix = data.order[i].dir === "asc" ? "~" : "";
                    order.push(prefix + mappings[data.order[i].column]);
                }

                // TODO: put this back if we put the state back
                //data.start = stt.p*data.length || data.start;   // NaN || data.start in case it's not defined
                var searchValue = (data.search.value).toLowerCase();
                var opts = {
                    disease: [disease],
                    outputstructure: "flat",
                    facets: false,
                    // direct: false,
                    size: data.length,
                    from: data.start,
                    sort: order,
                    search: searchValue,
                    draw: draw
                };

                // Restrict the associations to these targets
                if (target && target.length) {
                    opts.target = target;
                }

                opts = cttvAPIservice.addFacetsOptions(filters, opts);
                var queryObject = {
                    method: 'POST',
                    params: opts
                };

                cttvAPIservice.getAssociations(queryObject)
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

            // "order" : [[2, "desc"], [10, "desc"]],
            "order": [1, "desc"],   // stt.o || [2, "desc"],
            "orderMulti": false,
            "autoWidth": false,
            "ordering": true,
            "lengthMenu": [[10, 50, 200, 500], [10, 50, 200, 500]],
            "pageLength": 50,
            "language": {
                // "lengthMenu": "Display _MENU_ records per page",
                // "zeroRecords": "Nothing found - sorry",
                "info": "Showing _START_ to _END_ of _TOTAL_ targets",
                // "infoEmpty": "No records available",
                // "infoFiltered": "(filtered from _MAX_ total records)"
            },
            //"aoColumns": [
            //    { "asSorting": [ "desc", "asc" ] }, //first sort desc, then asc
            //]
        }, filename);

        return t;
    };

    function parseServerResponse(data) {
        var newData = new Array(data.length);

        var getScore = function (d, dt) {
            return ( !data[d].association_score.datatypes[dt] && !data[d].evidence_count.datatypes[dt] ) ? -1 : data[d].association_score.datatypes[dt];
        };

        for (var i = 0; i < data.length; i++) {
            // var dts = {};
            // dts.genetic_association = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "genetic_association"; }), "association_score")||0;
            // dts.somatic_mutation = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "somatic_mutation"; }), "association_score")||0;
            // dts.known_drug = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "known_drug"; }), "association_score")||0;
            // dts.affected_pathway = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "affected_pathway"; }), "association_score")||0;
            // dts.rna_expression = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "rna_expression"; }), "association_score")||0;
            // dts.literature = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "literature"; }), "association_score")||0;
            // dts.animal_model = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "animal_model"; }), "association_score")||0;

            //var dts = data[i].association_score.datatypes;
            // var ec = data[i].evidence_count.datatypes;
            var row = [];
            var geneLoc = "";
            var geneDiseaseLoc = "/evidence/" + data[i].target.id + "/" + data[i].disease.id;
            row.push("<a href='" + geneDiseaseLoc + "' title='" + data[i].target.gene_info.symbol + "'>" + data[i].target.gene_info.symbol + "</a>");
            // Ensembl ID
            //row.push(data[i].target.id);
            // The association score
            row.push(getColorStyleString(data[i].association_score.overall, geneDiseaseLoc));
            // Genetic association
            row.push(getColorStyleString(getScore(i, "genetic_association"), geneDiseaseLoc + (geneDiseaseLoc.indexOf('?') == -1 ? '?' : '&') + "view=sec:genetic_associations"));
            // Somatic mutation
            row.push(getColorStyleString(getScore(i, "somatic_mutation"), geneDiseaseLoc + (geneDiseaseLoc.indexOf('?') == -1 ? '?' : '&') + "view=sec:somatic_mutations"));
            // Known drug
            row.push(getColorStyleString(getScore(i, "known_drug"), geneDiseaseLoc + (geneDiseaseLoc.indexOf('?') == -1 ? '?' : '&') + "view=sec:known_drugs"));
            // Affected pathway
            row.push(getColorStyleString(getScore(i, "affected_pathway"), geneDiseaseLoc + (geneDiseaseLoc.indexOf('?') == -1 ? '?' : '&') + "view=sec:affected_pathways"));
            // Expression atlas
            row.push(getColorStyleString(getScore(i, "rna_expression"), geneDiseaseLoc + (geneDiseaseLoc.indexOf('?') == -1 ? '?' : '&') + "view=sec:rna_expression"));
            // Literature
            row.push(getColorStyleString(getScore(i, "literature"), geneDiseaseLoc + (geneDiseaseLoc.indexOf('?') == -1 ? '?' : '&') + "view=sec:literature"));
            // Animal model
            row.push(getColorStyleString(getScore(i, "animal_model"), geneDiseaseLoc + (geneDiseaseLoc.indexOf('?') == -1 ? '?' : '&') + "view=sec:animal_models"));

            // Total score
            row.push(data[i].association_score.datatypes.genetic_association +
                data[i].association_score.datatypes.somatic_mutation +
                data[i].association_score.datatypes.known_drug +
                data[i].association_score.datatypes.rna_expression +
                data[i].association_score.datatypes.affected_pathway +
                data[i].association_score.datatypes.animal_model);

            // Push gene name again instead
            row.push("<a href='" + geneDiseaseLoc + "' title='" + data[i].target.gene_info.name + "'>" + data[i].target.gene_info.name + "</a>");
            // just for for internal use to see direct and indirect associations
            //    if (data[i].is_direct === true) {
            //        row.push("<a href=" + geneDiseaseLoc + '> <i class="fa fa-circle"></i> ' + data[i].target.name + "</a>");
            //    } else {
            //        row.push("<a href=" + geneDiseaseLoc + '><i class="fa fa-circle-o"></i> ' + data[i].target.name + "</a>");
            //    }

            newData[i] = row;
        }
        return newData;
    }


    /*
    * TODO: currently not being called - will check when we put this back
    * Update function passes the current view (state) to the URL
    */
    function update(id, st) {
        //$log.log("update:st =", st);
         cttvLocationState.setStateFor(id, st);
    }


    /*
    * Renders page elements based on state from locationStateService
    */
    function render (new_state, old_state) {
        // TODO: might not need this?
        // state = ...
    }

    return {

        restrict: 'E',

        scope: {
            filename: '=',
            target: '=',
            disease: '=',
            filters : '=',
            stateId : '@?'
        },

        template: '<div>'
        + '  <cttv-matrix-table></cttv-matrix-table>'
        + '  <cttv-matrix-legend colors="legendData"></cttv-matrix-legend>'
        + '  <cttv-matrix-legend legend-text="legendText" colors="colors" layout="h"></cttv-matrix-legend>'
        + '</div>',

        link: function (scope, elem, attrs) {

            // TODO: initialize the state if we enable this feature
            // cttvLocationState.init();
            // state = cttvLocationState.getState()[scope.stateId] || {};

            // table itself
            var table = elem.children().eq(0).children().eq(0)[0];
            var dtable;

            // legend stuff
            scope.legendText = "Score";
            scope.colors = [];

            for (var i = 0; i <= 100; i += 25) {
                var j = i / 100;
                //scope.labs.push(j);
                scope.colors.push({color: colorScale(j), label: j});
            }
            scope.legendData = [
                {label: "No data", class: "no-data"}
            ];

            scope.stateId = scope.stateId || "dhm"; // Disease Heat Map ??

            // Download the whole table
            scope.downloadTable = function () {

                var size = 10000;
                // First make a call to know how many rows there are:
                var optsPreFlight = {
                    disease: [scope.disease],
                    outputstructure: "flat",
                    facets: false,
                    size: 1
                };
                // Restrict the associations to a list of targets
                if (scope.target && scope.target.length) {
                    optsPreFlight.target = scope.target;
                }
                optsPreFlight = cttvAPIservice.addFacetsOptions(scope.filters, optsPreFlight);

                var queryObject = {
                    method: 'POST',
                    params: optsPreFlight
                };
                cttvAPIservice.getAssociations(queryObject)
                    .then(function (resp) {
                        var total = resp.body.total;

                        function columnsNumberOk(csv, n) {
                            var firstRow = csv.split("\n")[0];
                            var cols = firstRow.split(",");

                            return cols.length === n;
                        }

                        function getNextChunk(size, from) {
                            var opts = {
                                disease: [scope.disease],
                                outputstructure: "flat",
                                facets: false,
                                format: "csv",
                                size: size,
                                fields: ["target.gene_info.symbol",
                                    "association_score.overall",
                                    "association_score.datatypes.genetic_association",
                                    "association_score.datatypes.somatic_mutation",
                                    "association_score.datatypes.known_drug",
                                    "association_score.datatypes.affected_pathway",
                                    "association_score.datatypes.rna_expression",
                                    "association_score.datatypes.literature",
                                    "association_score.datatypes.animal_model",
                                    "target.gene_info.name"],
                                from: from
                            };
                            if (scope.target && scope.target.length) {
                                opts.target = scope.target;
                            }

                            opts = cttvAPIservice.addFacetsOptions(scope.filters, opts);

                            var queryObject = {
                                method: 'POST',
                                params: opts
                            };

                            return cttvAPIservice.getAssociations(queryObject)
                                .then(function (resp) {
                                    var moreText = resp.body;

                                    if (columnsNumberOk(moreText, opts.fields.length)) {

                                        if (from > 0) {
                                            // Not in the first page, so remove the header row
                                            moreText = moreText.split("\n").slice(1).join("\n");
                                        }
                                        totalText += moreText;
                                        return totalText;
                                    }
                            });
                        }

                    var promise = $q(function (resolve, reject) {
                        resolve("");
                    });
                    var totalText = "";
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
                    promise.then(function (res) {
                        var b = new Blob([totalText], {type: "text/csv;charset=utf-8"});
                        saveAs(b, scope.filename + ".csv");
                        // var hiddenElement = document.createElement('a');
                        // hiddenElement.href = 'data:attachment/csv,' + encodeURI(totalText);
                        // hiddenElement.target = '_blank';
                        // hiddenElement.download = scope.filename + ".csv";
                        // hiddenElement.click();
                    });

                }, cttvAPIservice.defaultErrorHandler);
            };



            // TODO: check this
            // Do we want the directive to listen for changes in the URL?
            // Probably so, but not with this implementation of DataTables...
            // So for now we leave it OUT
            // scope.$on(cttvLocationState.STATECHANGED, function (evt, new_state, old_state) {
            //     render( new_state, old_state ); // if there are no facets, no worries, the API service will handle undefined
            // });

            scope.$watchGroup(["filters", "disease", "target"], function (attrs) {

                filters = attrs[0];
                targets = attrs[2];
                var disease = attrs[1];
                scope.target = attrs[2];

                //$log.log("diseaseAssociationsTableDirective:attrs:", attrs);
                // actually, is disease going to change?
                // I mean, if it changes, the page changes, right?
                // if the table exists, we just force an upload (will take the filters into account)
                //if (dtable) {
                //    $log.log("diseaseAssociationsTableDirective:not calling setupTable:");
                //    dtable.ajax.reload();
                //} else {
                //state = cttvLocationState.getState()[scope.stateId];
                // create a new table
                //dtable = setupTable(table, disease, scope.filename, scope.downloadTable);
                //dtable = undefined;
                //table.destroy();
                dtable = setupTable(table, scope.disease, scope.target, scope.filename, scope.downloadTable, state);

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
                //}
            });

            // Watch for filename changes
            // when available, we update the option for the CSV button, via a little hack:
            // we update the button action, wrapping the original action in a call where the 4th argument is updated with the correct title
            // scope.$watch( 'filename', function(val){
            // if(val){
            //     // replace spaces with underscores
            //     val = val.split(" ").join("_");
            //
            //     // update the export function to
            //     var act = dtable.button(".buttons-csv").action();   // the original export function
            //
            //     dtable.button(".buttons-csv").action(
            //         function(){
            //             //var opts = arguments[3];
            //             //opts.title = val;
            //             //act(arguments[0], arguments[1], arguments[2], opts);
            //             arguments[3].title = val;
            //             act.apply(this, arguments);
            //         }
            //     );
            //
            // }
            // });

        } // end link
    }; // end return
}]);
