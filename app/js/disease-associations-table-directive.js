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
.directive('cttvDiseaseAssociations', ['$log', 'cttvUtils', 'cttvDictionary', 'cttvFiltersService', 'cttvConsts', 'cttvAPIservice', '$q', function ($log, cttvUtils, cttvDictionary, cttvFiltersService, cttvConsts, cttvAPIservice, $q) {

    'use strict';

    var draw = 1;
    var filters = {};

    var colorScale = cttvUtils.colorScales.BLUE_0_1; //blue orig

    /*
    * Generates and returns the string representation of the span element
    * with color information for each cell
    */
    var getColorStyleString = function(value, href){
        var str="";
        if( value<=0 ){
            str = "<span class='no-data' title='No data'></span>"; // quick hack: where there's no data, don't put anything so the sorting works better
        } else {
            str = "<span style='color: "+colorScale(value)+"; background: "+colorScale(value)+";' title='Score: "+cttvUtils.floatPrettyPrint(value)+"'>"+cttvUtils.floatPrettyPrint(value)+"</span>";
            if( href ){
                str = "<a href=" + href + ">" + str + "</a>";
            }
        }

        return str;
    };


    /*
    * Columns definitions
    */
    var cols = [
        // empty col for the gene symbol
        {name:"", title:cttvDictionary.TARGET_SYMBOL},
        {name:"", title:cttvDictionary.ENSEMBL_ID},
        {name:"", title:cttvDictionary.ASSOCIATION_SCORE},
        // here are the datatypes:
        {name:cttvConsts.datatypes.GENETIC_ASSOCIATION, title:cttvDictionary[cttvConsts.datatypes.GENETIC_ASSOCIATION.toUpperCase()]},
        {name:cttvConsts.datatypes.SOMATIC_MUTATION, title:cttvDictionary[cttvConsts.datatypes.SOMATIC_MUTATION.toUpperCase()]},
        {name:cttvConsts.datatypes.KNOWN_DRUG, title:cttvDictionary[cttvConsts.datatypes.KNOWN_DRUG.toUpperCase()]},
        {name:cttvConsts.datatypes.AFFECTED_PATHWAY, title:cttvDictionary[cttvConsts.datatypes.AFFECTED_PATHWAY.toUpperCase()]},
        {name:cttvConsts.datatypes.RNA_EXPRESSION, title:cttvDictionary[cttvConsts.datatypes.RNA_EXPRESSION.toUpperCase()]},
        {name:cttvConsts.datatypes.LITERATURE, title:cttvDictionary[cttvConsts.datatypes.LITERATURE.toUpperCase()]},
        {name:cttvConsts.datatypes.ANIMAL_MODEL, title:cttvDictionary[cttvConsts.datatypes.ANIMAL_MODEL.toUpperCase()]},
        // empty col for sorting by total score (sum)
        {name:"", title:"total score"},
        // empty col for the gene name
        {name:"", title:cttvDictionary.TARGET_NAME}
    ];


    /*
    Setup the table cols and return the DT object
    */
    var setupTable = function(table, disease, filename){
        $log.log("setupTable()");
        // var t = $(table).DataTable( cttvUtils.setTableToolsParams({
        var t = $(table).DataTable({
            "dom": '<"clearfix" <"clear small" i><"pull-left small" f><"pull-right"<"#cttvTableDownloadIcon">>rt<"pull-left small" l><"pull-right small" p>>',
            "processing": false,
            "serverSide": true,
            "ajax": function (data, cbak, params) {
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
                    0: "target.gene_info.symbol",
                    2: "association_score.overall",
                    3: "association_score.datatypes." + cttvConsts.datatypes.GENETIC_ASSOCIATION,
                    4: "association_score.datatypes." + cttvConsts.datatypes.SOMATIC_MUTATION,
                    5: "association_score.datatypes." + cttvConsts.datatypes.KNOWN_DRUG,
                    6: "association_score.datatypes." + cttvConsts.datatypes.AFFECTED_PATHWAY,
                    7: "association_score.datatypes." + cttvConsts.datatypes.RNA_EXPRESSION,
                    8: "association_score.datatypes." + cttvConsts.datatypes.LITERATURE,
                    9: "association_score.datatypes." + cttvConsts.datatypes.ANIMAL_MODEL,
                    10: "association_score.overall"
                };
                var order = [];
                for (var i=0; i<data.order.length; i++) {
                    var prefix = data.order[i].dir === "asc" ? "~" : "";
                    order.push(prefix + mappings[data.order[i].column]);
                }

                var opts = {
                    disease: disease,
                    outputstructure: "flat",
                    facets: false,
                    // direct: false,
                    size: data.length,
                    from: data.start,
                    sort: order,
                    search: data.search.value,
                    draw: draw
                };

                opts = cttvAPIservice.addFacetsOptions(filters, opts);

                cttvAPIservice.getAssociations(opts)
                    .then (function (resp) {
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
            "columns": (
                function(){
                    var a=[];
                    for(var i=0; i<cols.length; i++){
                        a.push({ "title": "<div><span title='"+cols[i].title+"'>"+cols[i].title+"</span></div>", "name":cols[i].name });
                    }
                    return a;
            })(),
                "columnDefs" : [
                    {
                        "targets" : [1,10],
                        "visible" : false
                    },
                    {
                        "targets" : [1,11],
                        "orderable": false
                    },
                    { "orderSequence": ["desc", "asc"], "targets": [2,3,4,5,6,7,8,9,10] },
                    { "orderSequence": ["asc", "desc"], "targets": [0]}
                ],
                // "order" : [[2, "desc"], [10, "desc"]],
                "order": [2, "desc"],
                "orderMulti": false,
                "autoWidth": false,
                "ordering": true,
                "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
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
            },
            filename
        );

        return t;
    };

    function parseServerResponse (data){
        var newData = new Array(data.length);

        for (var i=0; i<data.length; i++) {
            // var dts = {};
            // dts.genetic_association = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "genetic_association"; }), "association_score")||0;
            // dts.somatic_mutation = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "somatic_mutation"; }), "association_score")||0;
            // dts.known_drug = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "known_drug"; }), "association_score")||0;
            // dts.affected_pathway = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "affected_pathway"; }), "association_score")||0;
            // dts.rna_expression = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "rna_expression"; }), "association_score")||0;
            // dts.literature = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "literature"; }), "association_score")||0;
            // dts.animal_model = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "animal_model"; }), "association_score")||0;

            var dts = data[i].association_score.datatypes;
            var row = [];
            var geneLoc = "";
            var geneDiseaseLoc = "/evidence/" + data[i].target.id + "/" + data[i].disease.id;
            row.push("<a href='" + geneDiseaseLoc + "' title='"+data[i].target.gene_info.symbol+"'>" + data[i].target.gene_info.symbol + "</a>");
            // Ensembl ID
            row.push(data[i].target.id);
            // The association score
            row.push( getColorStyleString(data[i].association_score.overall, geneDiseaseLoc ) );
            // Genetic association
            row.push( getColorStyleString( dts.genetic_association, geneDiseaseLoc + (geneDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=genetic_associations") );
            // Somatic mutation
            row.push( getColorStyleString( dts.somatic_mutation, geneDiseaseLoc +    (geneDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=somatic_mutations") );
            // Known drug
            row.push( getColorStyleString( dts.known_drug, geneDiseaseLoc +          (geneDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=known_drugs") );
            // Affected pathway
            row.push( getColorStyleString( dts.affected_pathway, geneDiseaseLoc +    (geneDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=affected_pathways") );
            // Expression atlas
            row.push( getColorStyleString( dts.rna_expression, geneDiseaseLoc +      (geneDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=rna_expression") );
            // Literature
            row.push( getColorStyleString( dts.literature, geneDiseaseLoc +(geneDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=literature"));
            // Animal model
            row.push( getColorStyleString( dts.animal_model, geneDiseaseLoc +        (geneDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=animal_models") );

            // Total score
            row.push( dts.genetic_association+
                      dts.somatic_mutation+
                      dts.known_drug+
                      dts.rna_expression+
                      dts.affected_pathway+
                      dts.animal_model) ;

            // Push gene name again instead
            row.push("<a href='" + geneDiseaseLoc + "' title='"+data[i].target.gene_info.name+"'>" + data[i].target.gene_info.name + "</a>");
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


    return {

        restrict: 'E',

        scope: {
            filename : '=',
            disease: '=',
            filters : '=',
        },

        template: '<div>'
        + ' <div class="clearfix"><div class="pull-right"><a class="btn btn-default buttons-csv buttons-html5" ng-click="downloadTable()"><span class="fa fa-download" title="Download as CVS"></span></a></div></div>'
        +'  <cttv-matrix-table></cttv-matrix-table>'
        +'  <cttv-matrix-legend colors="legendData"></cttv-matrix-legend>'
        +'  <cttv-matrix-legend legend-text="legendText" colors="colors" layout="h"></cttv-matrix-legend>'
        +'</div>',

        link: function (scope, elem, attrs) {
            // table itself
            var table = elem.children().eq(0).children().eq(1)[0];
            var dtable;

            // legend stuff
            scope.legendText = "Score";
            scope.colors = [];
            for(var i=0; i<=100; i+=25){
                var j=i/100;
                //scope.labs.push(j);
                scope.colors.push( {color:colorScale(j), label:j} );
            }
            scope.legendData = [
                {label:"No data", class:"no-data"}
            ];

            // Download the whole table
            scope.downloadTable = function () {
                var size = 10000;
                // First make a call to know how many rows there are:
                var optsPreFlight = {
                    disease: scope.disease,
                    outputstructure: "flat",
                    facets: false,
                    size: 1
                };
                optsPreFlight = cttvAPIservice.addFacetsOptions(scope.filters, optsPreFlight);
                cttvAPIservice.getAssociations(optsPreFlight)
                    .then (function (resp) {
                        var total = resp.body.total;

                        function getNextChunk (size, from) {
                            var opts = {
                                disease: scope.disease,
                                outputstructure: "flat",
                                facets: false,
                                format: "csv",
                                size: size,
                                fields: ["target.gene_info.symbol", "association_score.overall", "association_score.datatypes.genetic_association", "association_score.datatypes.somatic_mutation", "association_score.datatypes.known_drug", "association_score.datatypes.affected_pathway", "association_score.datatypes.rna_expression", "association_score.datatypes.literature", "association_score.datatypes.animal_model", "target.gene_info.name"],
                                from: from
                            };
                            opts = cttvAPIservice.addFacetsOptions(scope.filters, opts);

                            return cttvAPIservice.getAssociations(opts)
                                .then (function (resp) {
                                    console.log(from);
                                    var moreText = resp.body;
                                    if (from>0) {
                                        // Not in the first page, so remove the header row
                                        moreText = moreText.split("\n").slice(1).join("\n");
                                    }
                                    totalText += moreText;
                                    return totalText;
                                });
                        }

                        var promise = $q(function (resolve, reject) {
                            resolve ("");
                        });
                        var totalText = "";
                        var promises = [];
                        for (var i=0; i<total; i+=size) {
                            promises.push ({
                                    from: i,
                                    total: size
                                });
                            // promises.push(getNextChunk(size, i));
                        }
                        promises.forEach(function (p) {
                            promise = promise.then (function () {
                                return getNextChunk(p.total, p.from);
                            });
                        });
                        promise.then (function (res) {
                            var hiddenElement = document.createElement('a');
                            hiddenElement.href = 'data:attachment/csv,' + encodeURI(totalText);
                            hiddenElement.target = '_blank';
                            hiddenElement.download = scope.filename + ".csv";
                            hiddenElement.click();
                        });

                    }, cttvAPIservice.defaultErrorHandler);
            };

            scope.$watchGroup(["filters", "disease"], function (attrs) {
                filters = attrs[0];
                var disease = attrs[1];
                // if the table exists, we just force an upload (will take the filters into account)
                if (dtable) {
                    dtable.ajax.reload();
                } else {
                    // create a new table
                    dtable = setupTable(table, disease, scope.filename);
                }
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
