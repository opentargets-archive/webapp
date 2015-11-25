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
.directive('cttvDiseaseAssociations', ['$log', 'cttvUtils', 'cttvDictionary', 'cttvFiltersService', 'cttvConsts', function ($log, cttvUtils, cttvDictionary, cttvFiltersService, cttvConsts) {

    'use strict';

    var colorScale = cttvUtils.colorScales.BLUE_0_1; //blue orig

    /*
    * Generates and returns the string representation of the span element
    * with color information for each cell
    */
    var getColorStyleString = function(value, href){
        var str="";
        value = value.toExponential(2);
        if( value<=0 ){
            str = "<span class='no-data' title='No data'></span>"; // quick hack: where there's no data, don't put anything so the sorting works better
        } else {
            str = "<span style='color: "+colorScale(value)+"; background: "+colorScale(value)+";' title='Score: "+value+"'>"+value+"</span>";
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
        // empty col for the gene name
        {name:"", title:""},
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
        {name:"", title:""}
    ];


    /*
    Setup the table cols and return the DT object
    */
    var setupTable = function(table, filename){
        $log.log("setupTable()");
        var t = $(table).DataTable( cttvUtils.setTableToolsParams({
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
                    { "orderSequence": [ "desc", "asc"], "targets": "_all" }
                ],
                "order" : [[2, "desc"], [10, "desc"]],
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
        ));

        return t;
    };

    var updateTable = function (table, data, target, filters) {

        var datatypes = filters.datatypes || [];

        var newData = new Array(data.length);

        for (var i=0; i<data.length; i++) {
            var dts = {};
            dts.genetic_association = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "genetic_association"; }), "association_score")||0;
            dts.somatic_mutation = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "somatic_mutation"; }), "association_score")||0;
            dts.known_drug = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "known_drug"; }), "association_score")||0;
            dts.affected_pathway = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "affected_pathway"; }), "association_score")||0;
            dts.rna_expression = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "rna_expression"; }), "association_score")||0;
            dts.literature = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "literature"; }), "association_score")||0;
            dts.animal_model = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "animal_model"; }), "association_score")||0;
            var row = [];
            var geneLoc = "";
            var geneDiseaseLoc = "/evidence/" + data[i].target.id + "/" + data[i].disease.id + (filters.score_str ? "?score_str=" + filters.score_str[0] : "");
            row.push("<a href='" + geneDiseaseLoc + "'>" + data[i].target.symbol + "</a>");
            // Ensembl ID
            row.push(data[i].target.id);
            // The association score
            row.push( getColorStyleString(data[i].association_score, geneDiseaseLoc ) );
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
            row.push("<a href=" + geneDiseaseLoc + ">" + data[i].target.name + "</a>");

            newData[i] = row;

        }


        // now set the table content:

        // first, clear any existing content
        table.clear();

        // now here would be a good place to hide/show any columns based on datatypes ??
        /*for(var i=3; i<table.columns()[0].length-2; i++){
            // only look at datatypes cols, so the first few and last few (including the total score are left out...)
            table.column(i).visible( _.isEmpty(datatypes) );
        }

        if( !_.isEmpty(datatypes) ){
            datatypes.forEach(function(value){
                table.column(value+':name').visible(true);
            });
        }*/

        // render with new data
        table.rows.add(newData).draw();

    }; // end updateTable



    return {

        restrict: 'E',

        scope: {
            filename : '=',
            data : '='
        },

        template: '<div ng-show="data.length>0">'
        +'  <cttv-matrix-table></cttv-matrix-table>'
        +'  <cttv-matrix-legend colors="legendData"></cttv-matrix-legend>'
        +'  <cttv-matrix-legend legend-text="legendText" colors="colors" layout="h"></cttv-matrix-legend>'
        +'</div>'
        +'<div ng-show="data.length==0">'+cttvDictionary.NO_DATA+'</div>',

        link: function (scope, elem, attrs) {

            // table itself
            var table = elem.children().eq(0).children().eq(0)[0];
            var dtable = setupTable(table, scope.filename);

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


            // Watch for data changes and refresh the view when that happens
            scope.$watch("data", function(n,o){
                //console.log(scope);
                var filters = cttvFiltersService.parseURL();
                // console.log(filters);
                $log.debug("Data:");
                if( scope.data ){
                    $log.debug("Update table - "+scope.data.length);
                    //console.log(scope.data.selected);
                    updateTable(dtable, scope.data, attrs.target, filters);
                }
            });

            // Watch for filename changes
            // when available, we update the option for the CSV button, via a little hack:
            // we update the button action, wrapping the original action in a call where the 4th argument is updated with the correct title
            scope.$watch( 'filename', function(val){
                if(val){
                    // replace spaces with underscores
                    val = val.split(" ").join("_");

                    // update the export function to
                    var act = dtable.button(".buttons-csv").action();   // the original export function

                    dtable.button(".buttons-csv").action(
                        function(){
                            //var opts = arguments[3];
                            //opts.title = val;
                            //act(arguments[0], arguments[1], arguments[2], opts);
                            arguments[3].title = val;
                            act.apply(this, arguments);
                        }
                    );

                }
            });

        } // end link
    }; // end return
}]);
