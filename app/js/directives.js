
/* Directives */
angular.module('cttvDirectives', [])



    /**
    * Matrix (heatmap) view for target associations
    */
    .directive('cttvTargetAssociationsTable', ['$log', 'cttvAPIservice', 'clearUnderscoresFilter', 'upperCaseFirstFilter', 'cttvUtils', 'cttvDictionary', '$compile', 'cttvConsts', '$location', function ($log, cttvAPIservice, clearUnderscores, upperCaseFirst, cttvUtils, cttvDictionary, $compile, cttvConsts, $location) {
        'use strict';

        var cols = [
            {name: "", title: ""},
            {name: "", title: "EFO"},
            {name: "", title: "TherapeuticArea EFO"},
            {name: "", title:cttvDictionary.ASSOCIATION_SCORE},
            // here are the datatypes:
            {name:cttvConsts.datatypes.GENETIC_ASSOCIATION, title:cttvDictionary[cttvConsts.datatypes.GENETIC_ASSOCIATION.toUpperCase()]},
            {name:cttvConsts.datatypes.SOMATIC_MUTATION, title:cttvDictionary[cttvConsts.datatypes.SOMATIC_MUTATION.toUpperCase()]},
            {name:cttvConsts.datatypes.KNOWN_DRUG, title:cttvDictionary[cttvConsts.datatypes.KNOWN_DRUG.toUpperCase()]},
            {name:cttvConsts.datatypes.RNA_EXPRESSION, title:cttvDictionary[cttvConsts.datatypes.RNA_EXPRESSION.toUpperCase()]},
            {name:cttvConsts.datatypes.AFFECTED_PATHWAY, title:cttvDictionary[cttvConsts.datatypes.AFFECTED_PATHWAY.toUpperCase()]},
            {name:cttvConsts.datatypes.LITERATURE, title:cttvDictionary[cttvConsts.datatypes.LITERATURE.toUpperCase()]},
            {name:cttvConsts.datatypes.ANIMAL_MODEL, title:cttvDictionary[cttvConsts.datatypes.ANIMAL_MODEL.toUpperCase()]},
            {name:"", title:""}
        ];

        var reverseDict = {
            "Genetic associations" : "genetic_association",
            "Somatic mutations" : "somatic_mutation",
            "Known drugs" : "known_drug",
            "RNA expression" : "rna_expression",
            "Affected pathways" : "affected_pathway",
            "Text mining" : "literature",
            "Animal models" : "animal_model"
        };

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
        var cols = [
            // empty col for the gene name
            {name:"", title:""},
            {name:"", title:cttvDictionary.ENSEMBL_ID},
            {name:"", title:cttvDictionary.ASSOCIATION_SCORE},
            // here are the datatypes:
            {name:cttvConsts.datatypes.GENETIC_ASSOCIATION, title:cttvDictionary[cttvConsts.datatypes.GENETIC_ASSOCIATION.toUpperCase()]},
            {name:cttvConsts.datatypes.SOMATIC_MUTATION, title:cttvDictionary[cttvConsts.datatypes.SOMATIC_MUTATION.toUpperCase()]},
            {name:cttvConsts.datatypes.KNOWN_DRUG, title:cttvDictionary[cttvConsts.datatypes.KNOWN_DRUG.toUpperCase()]},
            {name:cttvConsts.datatypes.RNA_EXPRESSION, title:cttvDictionary[cttvConsts.datatypes.RNA_EXPRESSION.toUpperCase()]},
            {name:cttvConsts.datatypes.AFFECTED_PATHWAY, title:cttvDictionary[cttvConsts.datatypes.AFFECTED_PATHWAY.toUpperCase()]},
            {name:cttvConsts.datatypes.LITERATURE, title:cttvDictionary[cttvConsts.datatypes.LITERATURE.toUpperCase()]},
            {name:cttvConsts.datatypes.ANIMAL_MODEL, title:cttvDictionary[cttvConsts.datatypes.ANIMAL_MODEL.toUpperCase()]},
            // empty col for sorting by total score (sum)
            {name:"", title:"total score"},
            // empty col for the gene name
            {name:"", title:""}
        ];
        */



        /*
        Setup the table cols and return the DT object
        */
        var setupTable = function(table, filename){
            return $(table).DataTable( cttvUtils.setTableToolsParams({
                //"data": newData,
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
                    }
                ],
                "order" : [[3, "desc"]],
                "autoWidth": false,
                "ordering": true,
                "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
                "pageLength": 50
            },
            filename ));
        };

        return {

            restrict: 'E',


            scope: {
                loadprogress : '=',
                filename : '@',
                datatypes : '@'
            },


            template: '<cttv-matrix-table></cttv-matrix-table>'
            +'<cttv-matrix-legend colors="legendData"></cttv-matrix-legend>'
            +'<cttv-matrix-legend legend-text="legendText" colors="colors" layout="h"></cttv-matrix-legend>',


            link: function (scope, elem, attrs) {


                var colorScale = d3.scale.linear()
                .domain([0,1])
                .range(["#CBDCEA", "#005299"]); // blue orig
                //.range(["#DDDDDD","#FFFF00", "#fc4e2a"]); // amber-red
                //.range(["#DDDDDD","#5CE62E", "#40A120"]);    // green
                //.range(["#EEEEEE","#a6bddb", "#045a8d"]);
                //.range(["#EEEEEE","#eff3ff","#2171b5"])

                /*
                * Generates and returns the string representation of the span element
                * with color information for each cell
                */
                var getColorStyleString = function(value, href){

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


                /*
                * Fetch new data and update the table content
                * without destroying and recreating the table
                */
                var updateTable = function (table, datatypes) {
                    scope.loadprogress = true;

                    var dts = JSON.parse(attrs.datatypes);
                    var opts = {
                        target: attrs.target,
                        datastructure: "flat",
                        expandefo: false,
                    };

                    if (!_.isEmpty(dts)) {
                        opts.filterbydatatype = _.keys(dts);
                    }

                    //$log.debug( attrs.datatypes );
                    //$log.debug( dts );
                    //$log.debug( opts.filterbydatatype );

                    return cttvAPIservice.getAssociations (opts)
                    .then(function (resp) {
                        //resp = JSON.parse(resp.text);
                        scope.loadprogress = false;
                        resp = resp.body;
                        $log.log("RESP FOR TABLES (IN DIRECTIVE): ");
                        $log.log(resp);
                        var newData = [];

                        // Iterate
                        var iterateeEFO = function (str, ta) {
                            if (str === "") {
                                str = ta.efo_code;
                            } else {
                                str += "," + ta.efo_code;
                            }
                            return str;

                        };
                        var iterateeLabel = function (str, ta) {
                            if (str === "") {
                                str = ta.label;
                            } else {
                                str += ", " + ta.label;
                            }
                            return str;
                        };


                        for (var i=0; i<resp.data.length; i++) {
                            var data = resp.data[i];
                            if (data.efo_code === "cttv_disease") {
                                continue;
                            }
                            var datatypes = {};
                            datatypes.genetic_association = _.result(_.find(data.datatypes, function (d) { return d.datatype === "genetic_association"; }), "association_score")||0;
                            datatypes.somatic_mutation = _.result(_.find(data.datatypes, function (d) { return d.datatype === "somatic_mutation"; }), "association_score")||0;
                            datatypes.known_drug = _.result(_.find(data.datatypes, function (d) { return d.datatype === "known_drug"; }), "association_score")||0;
                            datatypes.rna_expression = _.result(_.find(data.datatypes, function (d) { return d.datatype === "rna_expression"; }), "association_score")||0;
                            datatypes.affected_pathway = _.result(_.find(data.datatypes, function (d) { return d.datatype === "affected_pathway"; }), "association_score")||0;
                            datatypes.literature = _.result(_.find(data.datatypes, function (d) { return d.datatype === "literature"; }), "association_score")||0;
                            datatypes.animal_model = _.result(_.find(data.datatypes, function (d) { return d.datatype === "animal_model"; }), "association_score")||0;
                            var row = [];

                            // Disease name
                            var geneDiseaseLoc = "/evidence/" + attrs.target + "/" + data.efo_code;
                            row.push("<a href=" + geneDiseaseLoc + ">" + data.label + "</a>");

                            // EFO (hidden)
                            row.push(data.efo_code);

                            // TherapeuticArea EFO (hidden)
                            var taStr = _.reduce(data.therapeutic_area, iterateeEFO, "");
                            row.push(taStr); // Neoplasm

                            // Association score
                            row.push( getColorStyleString( data.association_score, geneDiseaseLoc ) );

                            // Genetic association
                            row.push( getColorStyleString( datatypes.genetic_association, geneDiseaseLoc + "?sec=genetic_associations") );
                            // Somatic mutation
                            row.push( getColorStyleString( datatypes.somatic_mutation, geneDiseaseLoc + "?sec=somatic_mutations") );
                            // Known drug
                            row.push( getColorStyleString( datatypes.known_drug, geneDiseaseLoc + "?sec=known_drugs") );
                            // Expression atlas
                            row.push( getColorStyleString( datatypes.rna_expression, geneDiseaseLoc + "?sec=rna_expression") );
                            // Affected pathway
                            row.push( getColorStyleString( datatypes.affected_pathway, geneDiseaseLoc + "?sec=affected_pathways") );
                            // Literature
                            row.push(getColorStyleString(datatypes.literature, geneDiseaseLoc + "?sec=literature"));
                            // Animal model
                            row.push( getColorStyleString( datatypes.animal_model, geneDiseaseLoc + "?sec=animal_models") );
                            // Therapeutic area
                            row.push(_.reduce(data.therapeutic_area, iterateeLabel, ""));

                            newData.push(row);
                        }

                        // clear any existing data from the table
                        // and add the new data
                        table.clear().rows.add(newData).draw();

                    },
                    // Error in the Api?
                    cttvAPIservice.defaultErrorHandler
                );

            };    // end updateTable



            // -----------------------
            // Initialize table etc
            // -----------------------

            // table itself
            var table = elem.children().eq(0)[0];
            var dtable = setupTable(table, scope.filename);
            $log.log(dtable);
            // legend stuff
            //scope.labs = ["a","z"];
            scope.legendText = "Score";
            scope.colors = [];
            for(var i=0; i<=10; i+=2){
                var j=i/10;
                //scope.labs.push(j);
                scope.colors.push( {color:colorScale(j), label:j} );
            }
            scope.legendData = [
                {label:"No data", class:"no-data"}
            ];



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
            scope.$watch( function () { return attrs.datatypes; }, function (dts) {

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
            });

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

        } // end link

    }; // end return

}])    // end directive cttvTargetAssociationsTable

    /*
    *
    */
    .directive('cttvTargetAssociationsTree', ['$log', 'cttvAPIservice', 'cttvConsts', function ($log, cttvAPIservice, cttvConsts) {
        'use strict';

        var gat;
        return {
            restrict: 'E',
            scope: {},
            link: function (scope, elem, attrs) {

                var datatypesChangesCounter = 0;
                scope.$watch(function () { return attrs.datatypes; }, function (dts) {
                    dts = JSON.parse(dts);
                    if (datatypesChangesCounter>0) {
                        if (!gat) {
                            setTreeView();
                            return;
                        }
                        var opts = {
                            target: attrs.target,
                            datastructure: "tree",
                        };
                        if (!_.isEmpty(dts)) {
                            opts.filterbydatatype = _.keys(dts);
                        }
                        cttvAPIservice.getAssociations (opts)
                            .then (function (resp) {
                                var data = resp.body.data;
                                if (data) {
                                    gat
                                        .data(data)
                                        .datatypes(dts)
                                        .update();
                                    }
                                },
                                cttvAPIservice.defaultErrorHandler
                            );
                    }
                    datatypesChangesCounter++;
                });

                var setTreeView = function () {
                    ////// Tree view
                    // viewport Size
                    var viewportW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
                    var viewportH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

                    // Element Coord
                    var elemOffsetTop = elem[0].parentNode.offsetTop;

                    // BottomMargin
                    var bottomMargin = 50;

                    // TODO: This is not being used at the moment. We are fixing the size of the tree to 900px (see below)
                    var diameter = viewportH - elemOffsetTop - bottomMargin;
                    $log.log("DIAMETER FOR TREE: " + diameter);

                    var dts = JSON.parse(attrs.datatypes);
                    var opts = {
                        target: attrs.target,
                        datastructure: "tree"
                    };
                    if (!_.isEmpty(dts)) {
                        opts.filterbydatatype = _.keys(dts);
                    }
                    cttvAPIservice.getAssociations (opts)
                        .then (
                            function (resp) {
                                var data = resp.body.data;
                                if (_.isEmpty(data)) {
                                    return;
                                }
                                var fView = flowerView()
                                .fontsize(9)
                                .diagonal(100);

                                gat = geneAssociationsTree()
                                    .data(data)
                                    .datatypes(dts)
                                    .names(cttvConsts)
                                    .diameter(900)
                                    .legendText("<a xlink:href='/faq#association-score'><text style=\"fill:#3a99d7;cursor:pointer\" alignment-baseline=central>Score</text></a>")
                                    .target(attrs.target);
                                gat(fView, elem[0]);
                            },
                            cttvAPIservice.defaultErrorHandler
                        );
                };

                scope.$watch(function () { return attrs.target; }, function (val) {
                    setTreeView();
                });

                scope.$watch(function () { return attrs.focus; }, function (val) {
                    if (val === "None") {
                        return;
                    }

                    if (gat) {
                        gat.selectTherapeuticArea(val);
                    }
                });
            }
        };
    }])


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
    .directive('cttvDiseaseAssociations', ['$log', 'cttvUtils', 'cttvDictionary', 'cttvFiltersService', 'cttvConsts', '$location', function ($log, cttvUtils, cttvDictionary, cttvFiltersService, cttvConsts, $location) {
        'use strict';

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
            {name:cttvConsts.datatypes.RNA_EXPRESSION, title:cttvDictionary[cttvConsts.datatypes.RNA_EXPRESSION.toUpperCase()]},
            {name:cttvConsts.datatypes.AFFECTED_PATHWAY, title:cttvDictionary[cttvConsts.datatypes.AFFECTED_PATHWAY.toUpperCase()]},
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
                    }
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
                dts.rna_expression = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "rna_expression"; }), "association_score")||0;
                dts.affected_pathway = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "affected_pathway"; }), "association_score")||0;
                dts.literature = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "literature"; }), "association_score")||0;
                dts.animal_model = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "animal_model"; }), "association_score")||0;
                var row = [];
                var geneLoc = "";
                var geneDiseaseLoc = "/evidence/" + data[i].gene_id + "/" + target;
                row.push("<a href='" + geneDiseaseLoc + cttvUtils.location.addSearch($location.search()) + "'>" + data[i].label + "</a>");
                // Ensembl ID
                row.push(data[i].gene_id);
                // The association score
                row.push( getColorStyleString(data[i].association_score) );
                // Genetic Association
                row.push( getColorStyleString(dts.genetic_association) );
                // Somatic Mutations
                row.push( getColorStyleString(dts.somatic_mutation) );
                // Known Drugs
                row.push( getColorStyleString(dts.known_drug) );
                // RNA expression
                row.push( getColorStyleString(dts.rna_expression) );
                // Affected pathways
                row.push( getColorStyleString(dts.affected_pathway) );
                // Literature
                row.push( getColorStyleString(dts.literature) );
                // Animal models
                row.push( getColorStyleString(dts.animal_model) );
                // Total score
                row.push( dts.genetic_association+
                          dts.somatic_mutation+
                          dts.known_drug+
                          dts.rna_expression+
                          dts.affected_pathway+
                          dts.animal_model) ;

                // Push gene name again instead
                row.push("<a href=" + geneDiseaseLoc + cttvUtils.location.addSearch($location.search()) + ">" + data[i].label + "</a>");

                newData[i] = row;

            }


            // now set the table content:

            // first, clear any existing content
            table.clear();

            // now here would be a good place to hide/show any columns based on datatypes ??
            for(var i=3; i<table.columns()[0].length-2; i++){
                // only look at datatypes cols, so the first few and last few (including the total score are left out...)
                table.column(i).visible( _.isEmpty(datatypes) );
            }

            if( !_.isEmpty(datatypes) ){
                datatypes.forEach(function(value){
                    table.column(value+':name').visible(true);
                });
            }

            // render with new data
            table.rows.add(newData).draw();

        }; // end updateTable



        return {

            restrict: 'E',

            scope: {
                filename : '@',
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
                for(var i=0; i<=10; i+=2){
                    var j=i/10;
                    //scope.labs.push(j);
                    scope.colors.push( {color:colorScale(j), label:j} );
                }
                scope.legendData = [
                    {label:"No data", class:"no-data"}
                ];


                // Watch for data changes and refresh the view when that happens
                scope.$watch("data", function(n,o){
                    $log.debug("Data:");
                    if( scope.data ){
                        $log.debug("Update table - "+scope.data.length);
                        updateTable(dtable, scope.data, attrs.target, scope.data.selected);
                    }
                });

            } // end link
        }; // end return
    }])
    /*
    *
    */
    .directive('cttvTargetGenomeBrowser', ['cttvAPIservice', function (cttvAPIservice) {
        'use strict';

        return {
            restrict: 'E',
            link: function (scope, elem, attrs) {
                var efo = attrs.efo;
                var w = (attrs.width || elem[0].parentNode.offsetWidth) - 40;
                scope.$watch(function () {return attrs.target; }, function (target) {
                    if (target === "") {
                        return;
                    }
                    var newDiv = document.createElement("div");
                    newDiv.id = "cttvTargetGenomeBrowser";
                    elem[0].appendChild(newDiv);

                    var gB = tnt.board.genome()
                        .species("human")
                        .gene(attrs.target)
                        .context(20)
                        .width(w);

                    //gB.rest().proxyUrl("/ensembl");
                    //gB.rest().proxyUrl("/api/latest/ensembl");
                    gB.rest().proxyUrl("/proxy/rest.ensembl.org");
                    var theme = targetGenomeBrowser()
                        .chr(scope.chr)
                        .efo(efo);
                    theme(gB, cttvAPIservice.getSelf(), document.getElementById("cttvTargetGenomeBrowser"));
                });
            }
        };
    }])

    .directive('cttvTargetGeneTree', [function () {
        'use strict';

        return {
            restrict: 'E',
            link: function (scope, elem, attrs) {
                var w = 1140; // !!
                scope.$watch (function () { return attrs.target; }, function (target) {
                    if (target === "") {
                        return;
                    }
                    var newDiv = document.createElement("div");
                    newDiv.id = "cttvTargetGeneTree";
                    elem[0].appendChild(newDiv);

                    var gt = targetGeneTree()
                        .id(target)
                        .width(1100)
                        .proxy("/proxy/rest.ensembl.org");
                    gt(newDiv);
                });
            }
        };
    }])


    /*
    *
    */
    .directive('ebiExpressionAtlasBaselineSummary', ['cttvAPIservice', function (cttvAPIservice) {
        'use strict';

        return {
            restrict: 'E',
            link: function (scope, elem, attrs) {
                scope.$watch(function () { return attrs.target; }, function (target) {
                    if (target === "") {
                        return;
                    }
                    var newDiv = document.createElement("div");
                    newDiv.id = "cttvExpressionAtlas";
                    newDiv.className = "accordionCell";
                    elem[0].appendChild(newDiv);

                    // cttvAPIservice.getToken().then(function (resp) {
                    //     console.warn(resp.body);
                    //     var token = resp.body.token;
                    // var instance = new Biojs.AtlasHeatmap ({
                    //     gxaBaseUrl: '/api/latest/proxy/generic/',
                    //     //gxaBaseUrl : '/gxa',
                    //     params:'geneQuery=' + target + "&species=homo%20sapiens",
                    //     isMultiExperiment: true,
                    //     target : "cttvExpressionAtlas"
                    // });

                    // });

                    var atlasHeatmapBuilder = window.exposed;
                    atlasHeatmapBuilder({
                        gxaBaseUrl: '/proxy/www.ebi.ac.uk/gxa/',
                        params: 'geneQuery=' + target + "&species=homo%20sapiens",
                        isMultiExperiment: true,
                        target: "cttvExpressionAtlas"
                    });


                    // var instance = AtlasHeatmapModule.build ({
                    //     gxaBaseUrl: '/proxy/www.ebi.ac.uk/gxa',
                    //     //gxaBaseUrl : '/gxa',
                    //     params:'geneQuery=' + target + "&species=homo%20sapiens",
                    //     isMultiExperiment: true,
                    //     target : "cttvExpressionAtlas"
                    // });
                });
            },
        };
    }])


    /*
    *
    */
    .directive('cttvSearchSuggestions', function(){
        'use strict';

        return {
            restrict:'EA',
            templateUrl: 'partials/search-suggestions.html',
            replace: true,
            link: function(scope, elem, attrs){

            }
        };
    })



    /**
    * Flower graph
    */
    .directive('cttvGeneDiseaseAssociation', function(){
        'use strict';

        return {
            restrict:'EA',
            //transclude: 'true',
            scope: {
                associationData: '='
            },
            link: function(scope, elem, attrs){
                //var flower = flowerView().values(scope.associationData);
                //flower(elem[0]);

                scope.render = function(data){
                    if(data.length>0){
                        var flower = flowerView()
                            .values(data)
                            .diagonal(200);
                        flower(elem[0]);
                    }
                };

                // Watch for data changes
                scope.$watch(
                    'associationData',
                    function() {
                        scope.render(scope.associationData);
                    }//,
                    //true
                );
            }
        };
    })



    /*
    * A simple progress spinner using a fontawesome icon
    * Options:
    * size: size of the spinner icon; values 1-6; 1 is default
    */
    .directive('cttvProgressSpinner', function(){
        'use strict';

        return {
            restrict: 'EA',
            template: '<i class="fa fa-circle-o-notch fa-spin"></i>',
            link: function(scope, elem, attrs){
                if(attrs.size){
                    elem.addClass("fa-"+attrs.size+"x");
                }
            }
        };
    })



    /*
    * This creates a light-box style div with a spinner.
    * The spinner is automatically visible when there are *any* pending requests
    * Options:
    * size: as per cttvProgressSpinner; Default is 3.
    */
    .directive('cttvPageProgressSpinner', ['$log', 'cttvAPIservice', function ($log, cttvAPIservice) {
        'use strict';

        return {
            restrict: 'EA',
            template: '<div class="page-progress-spinner" ng-show="isloading"><span cttv-progress-spinner class="text-lowlight fa-{{size}}x"></span></div>',
            scope: {
                size: '@'
            },
            link: function(scope, elem, attrs){
                scope.size = scope.size ? scope.size : '3';

                scope.$watch(function(){return cttvAPIservice.activeRequests;}, function(newValue,oldValue){
                    scope.isloading = newValue>0;
                });
            }
        };
    }])



    /*
    *  Esssentially just a wrapper for the table tag, defined in hte template
    */
    .directive('cttvMatrixTable', function(){
        'use strict';

        return {
            restrict: 'EA',
            template: '<table class="table matrix-table"></table>',
            replace: true,
            link: function(scope, elem, attrs){
                /*
                var colorScale = d3.scale.linear()
                .domain([0,1])
                .range(["#e9f3f8", "#2383BA"]);

                var getColorStyleString = function(value){
                return "<span style='color: "+colorScale(value)+"; background: "+colorScale(value)+";' title='Score: "+value+"'>"+value+"</span>";
                }

                elem.on('$destroy', function() {
                // remove objects from memory as required
                });
                */
            }
        };
    })



    /*
    *
    */
    .directive('cttvMatrixLegend', function(){
        'use strict';

        var template = '<div class="matrix-legend matrix-legend-layout-{{layout}} clearfix">'

        // label above (v layout) or left (h layout) of legend
        +    '<span class="matrix-legend-from" ng-show="layout==\'h\'">{{labels[0] || colors[0].label}}</span>'

        // create the color swatches
        +    '<span class="matrix-legend-item clearfix" ng-repeat="item in colors">'
        +       '<span class="matrix-legend-background" ng-style="{\'background\':item.color}" ng-class="item.class"></span>'
        +       '<span class="matrix-legend-background-label matrix-legend-to" ng-hide="layout==\'h\'">{{item.label}}</span>'
        +    '</span>'

        // label below (v layout) or right (h layout) of legend
        +    '<span class="matrix-legend-to" ng-show="layout==\'h\'">{{labels[labels.length-1] || colors[colors.length-1].label}}</span>'

        + '</div>'

        // extra info
        + '<div class="matrix-legend-info"><a ng-if="legendText!=undefined" href="/faq#association-score"><span class="fa fa-question-circle"></span><span class="matrix-legend-text">{{legendText}}</span></a></div>'
        ;

        return {
            restrict: 'EA',
            template: template,
            //replace: true,
            scope: {
                labels: '=',
                colors: '=',
                legendText: '=',
                layout: '@'
            },
            controller: function($scope){
                // set the default layout
                $scope.layout = $scope.layout ? $scope.layout : 'v';
            }
            //link: function(scope, elem, attrs){

            // elem.on('$destroy', function() {
            //     // remove objects from memory as required
            // });

            //}
        };
    })



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
    .directive('cttvHpaTissueExpression', ['$log', 'cttvAPIservice', 'cttvUtils', function ($log, cttvAPIservice, cttvUtils) {
        'use strict';

        var colorScale = d3.scale.linear()
            .domain([1,3])
            .range(["#CBDCEA", "#005299"]); // blue orig

        var labelScale = d3.scale.ordinal()
            .domain([1,2,3])
            .range(["Low", "Medium", "High"]);

        var getColorStyleString = function(value){
            var span="";

            if(value===0){
                span = "<span class='value-0' title='Not expressed'>"+value+"</span>";
            } else if(value>0){
                var c = colorScale(value);
                var l = labelScale(value);
                span = "<span style='color: "+c+"; background: "+c+";' title='Expression: "+l+"'>"+value+"</span>";
            } else {
                span = "<span class='no-data' title='No data'></span>"; // quick hack: where there's no data, don't put anything so the sorting works better
            }


            return span;
        };

        var cols = [
            "Tissue",
            "Protein",
            "RNA",
            ""
        ];

        return {

            restrict: 'EA',

            scope: {
                target : '=',
                //loadprogress : '=',
                filename : '@'
            },

            template: '<cttv-matrix-table></cttv-matrix-table>'
            +'<cttv-matrix-legend colors="legendData"></cttv-matrix-legend>'
            +'<cttv-matrix-legend colors="colors" layout="h"></cttv-matrix-legend>',

            link: function (scope, elem, attrs) {

                // set the load progress flag to true before starting the API call
                //scope.loadprogress = true;

                // Watch for data changes
                scope.$watch(
                    'target',
                    function() {

                        // move cttvAPIservice.getExpression ({ in here
                        // ......

                        if( scope.target ){

                            cttvAPIservice.getExpression ({
                                gene: scope.target  // TODO: should be TARGET in API!!!
                            })
                            .then(

                                // success
                                function (resp) {

                                    // set hte load progress flag to false once we get the results
                                    //scope.loadprogress = false;

                                    var data = resp.body.data[scope.target].tissues;
                                    var newData = [];

                                    for (var tissue in data) {
                                        var row = [];
                                        row.push( tissue );
                                        row.push( getColorStyleString(data[tissue].protein.level) );
                                        row.push( getColorStyleString(data[tissue].rna.level) );
                                        row.push("");
                                        newData.push(row);

                                    }

                                    // -----------------------
                                    // Initialize table etc
                                    // -----------------------

                                    // table itself
                                    var table = elem.children().eq(0)[0];
                                    var dtable = $(table).dataTable(cttvUtils.setTableToolsParams({
                                        "data" : newData,
                                        "columns": (function(){
                                            var a=[];
                                            for(var i=0; i<cols.length; i++){
                                                a.push({ "title": "<div><span title='"+cols[i]+"'>"+cols[i]+"</span></div>" });
                                            }
                                            return a;
                                        })(),
                                        "order" : [[0, "asc"]],
                                        "autoWidth": false,
                                        "ordering": true,
                                        "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
                                        "pageLength": 50
                                    }, scope.filename ));


                                    // legend stuff
                                    scope.colors = [];
                                    for(var i=1; i<=3; i++){
                                        scope.colors.push( {color:colorScale(i), label:labelScale(i)} );
                                        $log.log(i +" : "+ labelScale(i));
                                    }

                                    scope.legendData = [
                                        {label:"No data", class:"no-data"},
                                        {label:"Not expressed", class:"value-0"}
                                    ];


                                },

                                // error
                                cttvAPIservice.defaultErrorHandler
                            );
                        }
                    }

                ); // end watch

            } // end link
        }; // end return
    }])



    /**
    * Top level container for all the facets.
    * This contains accordion etc
    */
    .directive('cttvFacets', ['$log', 'cttvAPIservice', 'cttvFiltersService' , function ($log, cttvAPIservice, cttvFiltersService) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                //target : '=',
                //loadprogress : '=',
                //filename : '@'
                //datatypes : '='
                //filters : '='
            },
            templateUrl: 'partials/facets.html',

            link: function (scope, elem, attrs) {
                scope.filters = cttvFiltersService.getFilters();
                scope.selectedFilters = cttvFiltersService.getSelectedFilters();
                scope.deselectAll = cttvFiltersService.deselectAll;
                //scope.updateFilter = function(id){
                //    cttvFiltersService.getFilter(id).toggle();
                //}
            },

            // /controller: function(scope){
            // /
            // /}

        };

    }])



    /**
     * The default "select all / clear all" controls for facets
     * @param facet the facet (i.e. instance of FilterCollection from the FilterService) we are rendering, e.g. datatypes, pathways, score , etc...
     */
    .directive('cttvDefaultFacetContols', ['$log' , function ($log) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                facet: '='
            },

            template: '<div class="cttv-facets-controls">'
                      + '    <span ng-click="facet.selectAll(false)">Clear all <i class="fa fa-times"></i></span>'
                      + '    <span ng-click="facet.selectAll(true)">Select all <i class="fa fa-check"></i></span>'
                      + '</div>',

            link: function (scope, elem, attrs) {},
        };
    }])



    /**
     * The Datatypes facet
     */
    .directive('cttvDatatypesFacet', ['$log' , function ($log) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                facet: '='
            },

            // template: '<div cttv-default-facet-contols facet="facet"></div>'
            //          +'<div cttv-checkbox-facet bucket="bucket" ng-repeat="bucket in facet.filters"></div>',
            template: '<div cttv-default-facet-contols facet="facet"></div>'
                     +'<div ng-init="isCollapsed=true" ng-repeat="datatype in facet.filters">'
                     +'    <cttv-parent-checkbox-facet bucket="datatype" collapsed="isCollapsed"></cttv-parent-checkbox-facet>'
                     +'    <div collapse="isCollapsed" style="padding-left:20px">'
                     //+'        <div></div>'
                     +'        <div cttv-checkbox-facet bucket="bucket" ng-repeat="bucket in datatype.collection.filters"></div>'
                     +'    </div>'
                     +'</div>',

            link: function (scope, elem, attrs) {},
        };
    }])



    /**
     * The Datatypes facet
     */
    .directive('cttvPathwaysFacet', ['$log' , function ($log) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                facet: '='
            },


            template: '<div cttv-default-facet-contols facet="facet"></div>'
                     +'<div ng-init="isCollapsed=true" ng-repeat="pathway in facet.filters">'
                     +'    <cttv-parent-checkbox-facet bucket="pathway" collapsed="isCollapsed"></cttv-parent-checkbox-facet>'
                     +'    <div collapse="isCollapsed" style="padding-left:20px">'
                     //+'          <div cttv-default-facet-contols facet="pathway.collection"></div>'
                     +'        <div cttv-checkbox-facet bucket="bucket" ng-repeat="bucket in pathway.collection.filters"></div>'
                     +'    </div>'
                     +'</div>',


            link: function (scope, elem, attrs) {},
        };
    }])



    /**
     * The Score facet
     */
    .directive('cttvScoreFacet', ['$log' , function ($log) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                facet: '='
            },


            template: '<div>'
                     +'    <cttv-score-histogram data="facet.data.buckets" min="facet.filters[0].key" max="facet.filters[1].key"></cttv-score-histogram>'
                     +'    <div><span class="pull-left">{{facet.filters[0].key}}</span><span class="pull-right">{{facet.filters[1].key}}</span></div>'
                     //+'       <input type="text" ng-model="facet.data.min"/>'
                     //+'       <label>{{facet.filters[0].label}}: {{facet.data.min}} {{facet.filters[1].label}}: {{facet.data.max}}</label>'
                     //+'    <label>Stringency <input type="text" ng-model="facet.filters[2].key"/></label>'
                     +'    <cttv-slider min=1 max=10 value="facet.filters[2].key"></cttv-slider>'
                     +'    <div><button type="button" class="btn btn-primary btn-xs" ng-click="facet.update()">Apply</button></div>'
                     +'</div>',


            link: function (scope, elem, attrs) {},
        };
    }])



    /**
     * The histogram
     */
    .directive('cttvScoreHistogram', ['$log', '$timeout', function ($log, $timeout) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                data: '=',
                min: '=',
                max: '='
            },


            template: '<div>'
                     +'</div>',


            link: function (scope, elem, attrs) {

                var data = scope.data;

                //$timeout(brushed,4000);

                var margin = {top: 10, right: 10, bottom: 20, left: 10},
                    width = 260 - margin.left - margin.right,
                    height = 150 - margin.top - margin.bottom,
                    barWidth = width / data.length;

                var tick = 1/data.length;

                var x = d3.scale.linear()
                    .domain([0, 1])
                    .range([0, width]);
                    //.ticks(data.length);

                var y = d3.scale.linear()
                    .domain([0, d3.max( data, function(d){return d.value;} )])
                    .range([height, 0]);

                var xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom")
                    .ticks(data.length);

                var svg = d3.select(elem.children().eq(0)[0]).append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                var bar = svg.selectAll(".bar")
                    .data(data)
                    .enter().append("g")
                    .attr("class", "bar")
                    .attr("transform", function(d,i) { return "translate(" + x( i/data.length ) + "," + y(d.value) + ")"; });

                bar.append("rect")
                    .attr("x", 1)
                    .attr("width", barWidth - 1)
                    .attr("height", function(d) { return height - y(d.value); });

                bar.append("text")
                    .attr("x", barWidth / 2)
                    .attr("y", 6)
                    .attr("dy", ".75em")
                    .attr("text-anchor", "middle")
                    .text(function(d) { return d.value; });

                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);


                // brushing
                var roundToScale = function(n){
                    $log.log(n+" / "+tick);
                    return (Math.round(n/tick)*tick).toFixed(1);
                }

                var update = function(o){
                    scope.min = o.min;
                    scope.max = o.max;
                }

                var mybrush = d3.svg.brush()
                    .x(x)
                    .extent([scope.min, scope.max])
                    .on("brush", function(){ scope.$apply(onBrush) })
                    .on("brushend", onBrushEnd);

                var gBrush = svg.append("g")
                    .attr("class", "brush")
                    .call(mybrush);

                gBrush.selectAll("rect")
                    .attr("height", height);


                function onBrushEnd(){
                    d3.select(this).call(mybrush.extent([scope.min, scope.max]));
                }


                function onBrush(){
                    var extent0 = mybrush.extent(),
                        extent1;

                    //extent1 = [ roundToScale(extent0[0]) , roundToScale(extent0[1]) ];
                    extent1 = [ extent0[0].toFixed(2), extent0[1].toFixed(2) ];
                    update( {min:extent1[0], max:extent1[1]} );

                }

                // DEPRECATED!
                function brushed() {
                    //$log.log("brushhhh");
                    var extent0 = mybrush.extent(),
                        extent1;

                    //$log.log(extent0);
                    //$log.log( roundToScale(extent0[0]) +" -> "+ x( roundToScale(extent0[0]) ) );
                    //$log.log(d3.event);
                    extent1 = [ roundToScale(extent0[0]) , roundToScale(extent0[1]) ];
                    update( {min:extent1[0], max:extent1[1]} );
                    /*
                    // if dragging, preserve the width of the extent
                    if (d3.event.mode === "move") {
                        var d0 = x( roundToScale(extent0[0]) ) ,
                        d1 = x( roundToScale(extent0[1]) ;
                        extent1 = [d0, d1];
                    }

                    // otherwise, if resizing, round both dates
                    else {
                        extent1 = extent0.map(d3.time.day.round);

                        // if empty when rounded, use floor & ceil instead
                        if (extent1[0] >= extent1[1]) {
                            extent1[0] = d3.time.day.floor(extent0[0]);
                            extent1[1] = d3.time.day.ceil(extent0[1]);
                        }
                    }
*/

                    $log.log(d3.select(this));
                    //d3.select(this).call(mybrush.extent(extent1));
                    //mybrush.extent(extent1);
                    d3.select(svg).call(mybrush.extent(extent1));
                }
            },
        };
    }])



    /**
     * The histogram
     */
    .directive('cttvSlider', ['$log', function ($log) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                min: '@',
                max: '@',
                value: '=?',    // optional initial position, or min if nothing specified
                config: '=?'    // optional configuration
            },


            //template: '<div></div>',


            link: function (scope, elem, attrs) {

                var margin = {top: 10, right: 10, bottom: 10, left: 10},
                    width = 260 - margin.left - margin.right,
                    height = 50 - margin.bottom - margin.top;

                var config = scope.config || {}

                var ticks = config.ticks || scope.max-scope.min;
                var tick = (scope.max-scope.min) / ticks;

                scope.value = scope.value || scope.min;

                // n: number
                // t: tick
                var roundToScale = function(n,t){
                    return (Math.round(n/t)*t).toFixed(1);
                }

                var x = d3.scale.linear()
                    .domain([scope.min, scope.max])
                    .range([0, width])
                    .clamp(true);

                var brush = d3.svg.brush()
                    .x(x)
                    .extent([0, 0])
                    .on("brush", onBrush);
                    //.on("brushend", function(){ scope.$apply(onBrushEnd) });

                var xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom")
                    .ticks(ticks)
                    //.tickFormat(function(d) { return d + "°"; })
                    .tickSize(0)
                    .tickPadding(12);

                var svg = d3.select(elem.eq(0)[0]).append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height / 2 + ")")
                    .call(xAxis)
                    .select(".domain")
                    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
                    .attr("class", "halo");


                var slider = svg.append("g")
                    .attr("class", "slider")
                    .call(brush);

                slider.selectAll(".extent,.resize")
                    .remove();

                var handle = slider.append("circle")
                    .attr("class", "handle")
                    .attr("transform", "translate(0," + height / 2 + ")")
                    .attr("r", 9);

                // init: move slider to initial position
                slider
                    .call(brush.event)
                    .transition() // gratuitous intro!
                    .duration(750)
                    .call(brush.extent([scope.value, scope.value]))
                    .call(brush.event);

                // attach event after initial animation is triggered (hack, I confess)
                brush.on("brushend", function(){ scope.$apply(onBrushEnd) });

                function onBrush() {
                    var value = brush.extent()[0];

                    if (d3.event.sourceEvent) { // not a programmatic event
                        value = roundToScale( x.invert(d3.mouse(this)[0]), tick);
                        brush.extent([value, value]);
                    }

                    // move the handle
                    handle.attr("cx", x(value));
                }

                function onBrushEnd() {
                    // update the scope value when finishing brushing
                    if (d3.event.sourceEvent) { // not a programmatic event
                        $log.log("onBrushEnd " + brush.extent()[0] + scope.value );
                        scope.value = parseInt(brush.extent()[0]); // TODO: this is a hack to make stringency work... make parseInt configurable from directive
                    }
                }

            },
        };
    }])



    /**
     * A directive for plain Checkbox facets.
     * @param bucket the instance of Filter object from the FilterService; this is likely in an ng-repeat thing like ng-repeat="bucket in filters"
     */
    .directive('cttvCheckboxFacet', ['$log' , function ($log) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                bucket: '='
            },

            template: '<div class="checkbox cttv-facet-checkbox">'
                     +'    <label ng-class="(!bucket.enabled) ? \'disabled\' : \'\'">'
                     +'        <input type="checkbox"'
                     +'            ng-value="{{bucket.id}}"'
                     +'            ng-checked="bucket.selected"'
                     +'            ng-disabled="!bucket.enabled"'
                     +'            ng-click="bucket.toggle()" >'
                     +'        {{bucket.label | upperCaseFirst | clearUnderscores}} <span class="text-lowlight small">({{bucket.count | metricPrefix:1}})</span>'
                     +'    </label>'
                     +'</div>',

            link: function (scope, elem, attrs) {},
        };
    }])



    /**
     * A directive for plain Checkbox facets.
     * @param bucket the instance of Filter object from the FilterService; this is likely in an ng-repeat thing like ng-repeat="bucket in filters"
     */
    .directive('cttvParentCheckboxFacet', ['$log' , function ($log) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                bucket: '=',
                collapsed: '='
            },

            template: '<div>'
                     +'    <div class="checkbox cttv-facet-checkbox">'
                     +'        <label ng-class="(!bucket.enabled) ? \'disabled\' : \'\'" class="cttv-facet-checkbox-label" style="max-width:80%">'
                     +'            <input type="checkbox"'
                     +'                cttv-ui-indeterminate="{{bucket.collection.getSelectedFilters().length>0 && (bucket.collection.filters.length > bucket.collection.getSelectedFilters().length)}}"'
                     +'                value="{{bucket.id}}"'
                     +'                ng-checked="bucket.selected || (bucket.collection.filters.length>0 && bucket.collection.filters.length == bucket.collection.getSelectedFilters().length)"'
                     +'                ng-disabled="!bucket.enabled || bucket.collection.getSelectedFilters().length>0"'
                     +'                ng-click="bucket.toggle()" >'
                     +'            {{bucket.label}}'
                     +'        </label>'
                     +'        <span class="text-lowlight small">({{bucket.count | metricPrefix:1}})</span>'
                     +'        <i class="pull-right text-lowlight fa" ng-class="{\'fa-plus\': collapsed, \'fa-minus\': !collapsed}" ng-click="collapsed = !collapsed" style="cursor:pointer" ng-show="bucket.enabled"></i>'
                     +'    </div>'
                     +'</div>',

            link: function (scope, elem, attrs) {},
        };
    }])



    /**
    * A directive for Checkbox facet with nested facets.

    .directive('cttvMultiCheckboxFacet', ['$log' , function ($log) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
                //bucket: '='
            },

            template: '',

            link: function (scope, elem, attrs) {},
        };
    }])
    */


    /**
    * A directive for Checkbox facet with nested facets.
    */
    .directive('cttvUiIndeterminate', ['$log' , function ($log) {
        'use strict';

        return {

            restrict: 'EA',

            link: function (scope, elem, attrs) {
                if (!attrs.type || attrs.type.toLowerCase() !== 'checkbox') {
                    return angular.noop;
                }

                scope.$watch(attrs.cttvUiIndeterminate, function(newVal) {
                    elem[0].indeterminate = !!newVal;
                });
            }
        };
    }])



    .directive('cttvModal', ['$log' , function ($log) {
        'use strict';

        return {

            restrict: 'EA',
            template: '<div>'
                     +'    <span class="fa fa-circle" style="position:absolute; top:-12px; right:-12px; color:#000; font-size:24px;"></span>'
                     +'    <span class="fa fa-times"  style="position:absolute; top:-8px; right:-8px; color:#FFF; font-size:16px"></span>'
                     +'</div>'
                     +'<div>Hello content</div>',
            link: function (scope, elem, attrs) {

            }
        };
    }])



    /**
     * This directive exposes the page scroll, so it can, for example,
     * be used to create nav bars that become sticky as the user scrolls the page
     * @param scroll-position - the name of the variable to hold the scroll amount
     * Example:
     *  <div sticky-scroller scroll-position="scroll" ng-class="scroll>80 ? 'fixed' : ''">
     *      Hello
     *  </div>
     */
    .directive('stickyScroller', ['$log', '$window', function ($log, $window) {
        'use strict';

        return {
            restrict: 'EA',
            scope: {
                scroll: '=scrollPosition',
            },
            link: function(scope, element, attrs) {
                var windowEl = angular.element($window);
                var handler = function() {
                    scope.scroll = windowEl[0].scrollY;
                    $log.log(scope.scroll);
                };
                windowEl.on('scroll', scope.$apply.bind(scope, handler));
                handler();
            }
        };
    }]);
