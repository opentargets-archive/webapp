/* Directives */
angular.module('cttvDirectives')


/**
* Matrix (heatmap) view for target associations
*/
// .directive('cttvTargetAssociationsTable', ['$log', 'cttvAPIservice', 'clearUnderscoresFilter', 'upperCaseFirstFilter', 'cttvUtils', 'cttvDictionary', '$compile', 'cttvConsts', '$location', function ($log, cttvAPIservice, clearUnderscores, upperCaseFirst, cttvUtils, cttvDictionary, $compile, cttvConsts, $location) {

.directive('cttvTargetAssociationsTable', ['$log', 'cttvAPIservice', 'cttvUtils', 'cttvDictionary', 'cttvConsts', '$location', function ($log, cttvAPIservice, cttvUtils, cttvDictionary, cttvConsts, $location) {


    'use strict';

    var draw = 1;
    var filters = {};

    var colorScale = cttvUtils.colorScales.BLUE_0_1; //blue orig

    /*
    * Generates and returns the string representation of the span element
    * with color information for each cell
    */
    var getColorStyleString = function(value, href){
        value = value.toExponential(2);
        var str="";
        if( value<=0 ){
            str = "<span class='no-data' title='No data'></span>"; // quick hack: where there's no data, we don't put anything, so the sorting works better
        } else {
            str = "<span style='color: "+colorScale(value)+"; background: "+colorScale(value)+";' title='Score: "+value+"'>"+value+"</span>";
            if( href ){
                str = "<a href=" + href + ">" + str + "</a>";
            }
        }

        return str;
    };


    var cols = [
        {name: "", title: cttvDictionary.DISEASE},
        {name: "", title: "EFO"},
        {name: "", title: "TherapeuticArea EFO"},
        {name: "", title:cttvDictionary.ASSOCIATION_SCORE},
        // here are the datatypes:
        {name:cttvConsts.datatypes.GENETIC_ASSOCIATION, title:cttvDictionary[cttvConsts.datatypes.GENETIC_ASSOCIATION.toUpperCase()]},
        {name:cttvConsts.datatypes.SOMATIC_MUTATION, title:cttvDictionary[cttvConsts.datatypes.SOMATIC_MUTATION.toUpperCase()]},
        {name:cttvConsts.datatypes.KNOWN_DRUG, title:cttvDictionary[cttvConsts.datatypes.KNOWN_DRUG.toUpperCase()]},
        {name:cttvConsts.datatypes.AFFECTED_PATHWAY, title:cttvDictionary[cttvConsts.datatypes.AFFECTED_PATHWAY.toUpperCase()]},
        {name:cttvConsts.datatypes.RNA_EXPRESSION, title:cttvDictionary[cttvConsts.datatypes.RNA_EXPRESSION.toUpperCase()]},
        {name:cttvConsts.datatypes.LITERATURE, title:cttvDictionary[cttvConsts.datatypes.LITERATURE.toUpperCase()]},
        {name:cttvConsts.datatypes.ANIMAL_MODEL, title:cttvDictionary[cttvConsts.datatypes.ANIMAL_MODEL.toUpperCase()]},
        {name:"", title: cttvDictionary.THERAPEUTIC_AREA}
    ];


    // TODO: remove this once the API returns full row data:
    var reverseDict = {
        "Genetic associations" : "genetic_association",
        "Somatic mutations" : "somatic_mutation",
        "Known drugs" : "known_drug",
        "RNA expression" : "rna_expression",
        "Affected pathways" : "affected_pathway",
        "Text mining" : "literature",
        "Animal models" : "animal_model"
    };

    // TODO: remove this once the API returns full row data:
    var hasDatatype = function (myDatatype, datatypes) {
        var thisDatatype = reverseDict[myDatatype];
        for (var i=0; i<datatypes.length; i++) {
            // var datatype = upperCaseFirst(clearUnderscores(datatypes[i]));
            // if (datatype.trim() === myDatatype.trim()) {
            //     return true;
            // }

            if (thisDatatype === datatypes[i]) {
                return true;
            }
        }
        return false;
    };

    /*
    Setup the table cols and return the DT object
    */
    var setupTable = function(table, target, filename){
        $log.log("setupTable()");
        return $(table).DataTable( cttvUtils.setTableToolsParams({
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
                    3: "overall",
                    4: "datatypes." + cttvConsts.datatypes.GENETIC_ASSOCIATION,
                    5: "datatypes." + cttvConsts.datatypes.SOMATIC_MUTATION,
                    6: "datatypes." + cttvConsts.datatypes.KNOWN_DRUG,
                    7: "datatypes." + cttvConsts.datatypes.AFFECTED_PATHWAY,
                    8: "datatypes." + cttvConsts.datatypes.RNA_EXPRESSION,
                    9: "datatypes." + cttvConsts.datatypes.LITERATURE,
                    10: "datatypes." + cttvConsts.datatypes.ANIMAL_MODEL,
                    11: "overall"
                };
                var order = [];
                for (var i=0; i<data.order.length; i++) {
                    var prefix = data.order[i].dir === "asc" ? "~" : "";
                    order.push(prefix + mappings[data.order[i].column]);
                }

                var opts = {
                    target: target,
                    outputstructure: "flat",
                    facets: false,
                    direct: true,
                    size: data.length,
                    from: data.start,
                    sort: order,
                    search: data.search.value,
                    draw: draw
                };

                opts = cttvAPIservice.addFacetsOptions(filters, opts);

                // If there is TA zoom...
                // TODO: Include TA zoom

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
            "columns": (function(){
                var a=[];
                for(var i=0; i<cols.length; i++){
                    a.push({ "title": "<div><span title='"+cols[i].title+"'>"+cols[i].title+"</span></div>", name: cols[i].name });
                }
                return a;
            })(),
            "columnDefs" : [
                {
                    "targets" : [1,2],
                    "visible" : false,
                },
                {
                    "targets": [3,4,5,6,7,8,9],
                    "asSorting": [ "desc", "asc"],
                },
                { "orderSequence": [ "desc", "asc"], "targets": "_all" }
            ],
            "order" : [[3, "desc"]],
            "orderMulti": false,
            "autoWidth": false,
            "ordering": true,
            "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
            "pageLength": 50
        },
        filename ));
    };

    function parseServerResponse (d) {
        // scope.n.diseases = resp.total;
        var newData = [];

        // Iterate
        var iterateeEFO = function (str, ta) {
            if (str === "") {
                str = ta;
            } else {
                str += "," + ta;
            }
            return str;

        };
        var iterateeLabel = function (str, ta) {
            if (str === "") {
                str = ta;
            } else {
                str += ", " + ta;
            }
            return str;
        };

        for (var i=0; i<d.length; i++) {
            var data = d[i];
            if (data.efo_code === "cttv_disease") {
                continue;
            }
            var datatypes = {};
            datatypes.genetic_association = _.result(_.find(data.datatypes, function (d) { return d.datatype === "genetic_association"; }), "association_score")||0;
            datatypes.somatic_mutation = _.result(_.find(data.datatypes, function (d) { return d.datatype === "somatic_mutation"; }), "association_score")||0;
            datatypes.known_drug = _.result(_.find(data.datatypes, function (d) { return d.datatype === "known_drug"; }), "association_score")||0;
            datatypes.affected_pathway = _.result(_.find(data.datatypes, function (d) { return d.datatype === "affected_pathway"; }), "association_score")||0;
            datatypes.rna_expression = _.result(_.find(data.datatypes, function (d) { return d.datatype === "rna_expression"; }), "association_score")||0;
            datatypes.literature = _.result(_.find(data.datatypes, function (d) { return d.datatype === "literature"; }), "association_score")||0;
            datatypes.animal_model = _.result(_.find(data.datatypes, function (d) { return d.datatype === "animal_model"; }), "association_score")||0;
            var row = [];

            // Disease name
            var geneDiseaseLoc = "/evidence/" + data.target.id + "/" + data.disease.id;

            row.push("<a href='" + geneDiseaseLoc + "' title='"+data.disease.name+"'>" + data.disease.name + "</a>");

            // EFO (hidden)
            row.push(data.disease.id);

            // TherapeuticArea EFO (hidden)
            var taStr = _.reduce(data.disease.therapeutic_area.codes, iterateeEFO, "");
            row.push(taStr); // Neoplasm

            // Association score
            row.push( getColorStyleString( data.association_score, geneDiseaseLoc ) );

            // Genetic association
            row.push( getColorStyleString( datatypes.genetic_association, geneDiseaseLoc + (geneDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=genetic_associations") );
            // Somatic mutation
            row.push( getColorStyleString( datatypes.somatic_mutation, geneDiseaseLoc +    (geneDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=somatic_mutations") );
            // Known drug
            row.push( getColorStyleString( datatypes.known_drug, geneDiseaseLoc +          (geneDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=known_drugs") );
            // Affected pathway
            row.push( getColorStyleString( datatypes.affected_pathway, geneDiseaseLoc +    (geneDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=affected_pathways") );
            // Expression atlas
            row.push( getColorStyleString( datatypes.rna_expression, geneDiseaseLoc +      (geneDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=rna_expression") );
            // Literature
            row.push( getColorStyleString( datatypes.literature, geneDiseaseLoc +            (geneDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=literature"));
            // Animal model
            row.push( getColorStyleString( datatypes.animal_model, geneDiseaseLoc +        (geneDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=animal_models") );
            // Therapeutic area
            var area = _.reduce(data.disease.therapeutic_area.labels, iterateeLabel, "");
            row.push("<span title='"+area+"'>"+area+"</span>");

            newData.push(row);
        }

        return newData;
    }

    return {

        restrict: 'E',

        scope: {
            target : '=',
            loadprogress : '=',
            filename : '=',
            datatypes : '@',
            facets : '=',
            n : '=ndiseases'
        },


        template: '<cttv-matrix-table></cttv-matrix-table>'
        +'<cttv-matrix-legend colors="legendData"></cttv-matrix-legend>'
        +'<cttv-matrix-legend legend-text="legendText" colors="colors" layout="h"></cttv-matrix-legend>',


        link: function (scope, elem, attrs) {


            /*
            * Fetch new data and update the table content
            * without destroying and recreating the table
            */
        //     var updateTable = function (table, facets) {
        //
        //         $log.log("*** update heatmap ***");
        //
        //         scope.loadprogress = true;
        //
        //         var opts = {
        //             target: attrs.target,
        //             outputstructure: "flat",
        //             facets: false
        //         };
        //         opts = cttvAPIservice.addFacetsOptions(facets, opts);
        //
        //
        //         return cttvAPIservice.getAssociations (opts)
        //         .then(function (resp) {
        //
        //             //resp = JSON.parse(resp.text);
        //             scope.loadprogress = false;
        //             resp = resp.body;
        //             $log.log("RESP FOR TABLES (IN DIRECTIVE): ");
        //             $log.log(resp);
        //
        //             // scope.n.diseases = resp.data.length;
        //             // clear any existing data from the table
        //             // and add the new data
        //             table.clear().rows.add(newData).draw();
        //
        //         },
        //         // Error in the Api?
        //         cttvAPIservice.defaultErrorHandler
        //     );
        //
        // };    // end updateTable



        // -----------------------
        // Initialize table etc
        // -----------------------

        // table itself
        var table = elem.children().eq(0)[0];
        var dtable;
        // var dtable = setupTable(table, scope.filename);

        // legend stuff
        //scope.labs = ["a","z"];
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

        scope.$watchGroup(["facets", "target"], function(attrs) {
            filters = attrs[0];
            var target = attrs[1];
            console.log("      => target: " + target);
            console.log("      => filters: ");
            console.log(filters);

            if (dtable) {
                dtable.ajax.reload();
            } else {
                dtable = setupTable(table, target, scope.filename);
            }
        });

        // TODO: This is firing a second time the table creation. Make sure only one table is created at a time
        /*
        * Watch for changes in the datatypes.
        * This is fired also at initization:
        * no need to watch for changes to target,
        * so we only have one call (might need to check in the future though).
        * We're also no longer removing/destroying the table
        * which is only created at initialization, again removing the need
        * to watch out for double created tables...
        */
        /*scope.$watch( function () { return attrs.datatypes; }, function (dts) {

            dts = JSON.parse(dts);

            updateTable(dtable, dts)
            .then(
                function () {
                    dtable.columns().eq(0).each (function (i) {

                        // first headers are "Disease", "EFO", "TA EFO", "Association score" and last one is "Therapeutic area"
                        if (i>3 && i<11) {
                            var column = dtable.column(i);
                            if (hasDatatype(column.header().textContent, _.keys(dts))) {
                                column.visible(true);
                            } else {
                                column.visible(false);
                            }
                        }

                    });
                },
                cttvAPIservice.defaultErrorHandler
            );

            // Hide the columns that are filtered out
        });*/

        // scope.$watch( 'facets', function (fct) {
            // updateTable(dtable, fct)
            // // TODO: remove this (column hiding code) once the API returns full row data:
            // .then(
            //     function () {
            //
            //         /*var dts = JSON.parse(attrs.datatypes);
            //         dtable.columns().eq(0).each (function (i) {
            //             //first headers are "Disease", "EFO", "TA EFO", "Association score" and last one is "Therapeutic area"
            //             if (i>3 && i<11) {
            //                 var column = dtable.column(i);
            //                 if (hasDatatype(column.header().textContent, _.keys(dts))) {
            //                     column.visible(true);
            //                 } else {
            //                     column.visible(false);
            //                 }
            //             }
            //
            //         });*/
            //     },
            //     cttvAPIservice.defaultErrorHandler
            // );
        // });

        scope.$watch (function () { return attrs.focus; }, function (val) {
            if (val === "None") {
                return;
            }

            if (dtable) {
                if ((val === "cttv_disease") || (val === "cttv_source")) {
                    val = "";
                }
                dtable
                    .column(2)
                    .search(val)
                    .draw();
            }
        });

        // Watch for filename changes
        // when available, we update the option for the CSV button, via a little hack:
        // we update the button action, wrapping the original action in a call where the 4th argument is updated with the correct title
        // scope.$watch( 'filename', function(val){
        //     if(val){
        //         // replace spaces with underscores
        //         val = val.split(" ").join("_");
        //
        //         // update the export function to
        //         var act = dtable.button(".buttons-csv").action();   // the original export function
        //
        //         dtable.button(".buttons-csv").action(
        //             function(){
        //                 //var opts = arguments[3];
        //                 //opts.title = val;
        //                 //act(arguments[0], arguments[1], arguments[2], opts);
        //                 arguments[3].title = val;
        //                 act.apply(this, arguments);
        //             }
        //         );
        //
        //     }
        // });

    } // end link

}; // end return

}]);    // end directive cttvTargetAssociationsTable
