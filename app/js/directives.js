
/* Directives */
angular.module('cttvDirectives', [])



    /**
     * Matrix (heatmap) view for target associations
     */
    .directive('cttvTargetAssociationsTable', ['$log', 'cttvAPIservice', 'clearUnderscoresFilter', 'upperCaseFirstFilter', 'cttvUtils', 'cttvDictionary', '$compile', function ($log, cttvAPIservice, clearUnderscores, upperCaseFirst, cttvUtils, cttvDictionary, $compile) {
        'use strict';

        var hasDatatype = function (myDatatype, datatypes) {
            for (var i=0; i<datatypes.length; i++) {
                var datatype = upperCaseFirst(clearUnderscores(datatypes[i]));
                if (datatype.trim() === myDatatype.trim()) {
                    return true;
                }
            }
            return false;
        };


        var cols = [
            "Disease",
            "EFO",
            "TherapeuticArea EFO",
            "Association score",
            "Genetic association",
            "Somatic mutation",
            "Known drug",
            "Rna expression",
            "Affected pathway",
            "Animal model",
            "Therapeutic area"
        ];


        /*
         Setup the table cols and return the DT object
        */
        var setupTable = function(table, filename){
            return $(table).DataTable( cttvUtils.setTableToolsParams({
                        //"data": newData,
                        "columns": (function(){
                            var a=[];
                            for(var i=0; i<cols.length; i++){
                                a.push({ "title": "<div><span title='"+cols[i]+"'>"+cols[i]+"</span></div>" });}
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
                    }, filename ));
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
                        gene: attrs.target,
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
                                // Animal model
                                row.push( getColorStyleString( datatypes.animal_model, geneDiseaseLoc + "?sec=animal_models") );
                                // Therapeutic area
                                row.push(_.reduce(data.therapeutic_area, iterateeLabel, ""));

                                newData.push(row);
                            }

                            // clear any existing data from the table
                            // and add the new data
                            table.clear().rows.add(newData).draw();

                        });

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
                    .then(function () {
                        dtable.columns().eq(0).each (function (i) {

                            // first headers are "Disease", "EFO", "TA EFO", "Association score" and last one is "Therapeutic area"
                            if (i>3 && i<10) {
                                var column = dtable.column(i);
                                if (hasDatatype(column.header().innerText, _.keys(dts))) {
                                    column.visible(true);
                                } else {
                                    column.visible(false);
                                }
                            }

                        });
                    });

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
    .directive('cttvTargetAssociationsTree', ['$log', 'cttvAPIservice', function ($log, cttvAPIservice) {
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
                gene: attrs.target,
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
                });
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
                         gene: attrs.target,
                         datastructure: "tree"
                     };
                     if (!_.isEmpty(dts)) {
                         opts.filterbydatatype = _.keys(dts);
                     }
                     cttvAPIservice.getAssociations (opts)
                        .then (function (resp) {
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
                                .diameter(900)
                                .legendText("<a xlink:href='/faq#association-score'><text style=\"fill:#3a99d7;cursor:pointer\" alignment-baseline=central>Score</text></a>")
                                .target(attrs.target);
                            gat(fView, elem[0]);
                        });
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
    .directive('cttvDiseaseAssociations', ['$log', 'cttvAPIservice', 'cttvUtils', 'cttvDictionary', 'cttvFiltersService', 'cttvConsts', function ($log, cttvAPIservice, cttvUtils, cttvDictionary, cttvFiltersService, cttvConsts) {
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
            {name:cttvConsts.datatypes.ANIMAL_MODEL, title:cttvDictionary[cttvConsts.datatypes.ANIMAL_MODEL.toUpperCase()]},
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
                                "targets" : [1],
                                "visible" : false
                            }
                        ],
                        "order" : [[3, "desc"]],
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
                    }, filename ));

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
                dts.animal_model = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "animal_model"; }), "association_score")||0;
                var row = [];
                var geneLoc = "";
                var geneDiseaseLoc = "/evidence/" + data[i].gene_id + "/" + target;
                row.push("<a href='" + geneDiseaseLoc + "'>" + data[i].label + "</a>");
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
                // Animal models
                row.push( getColorStyleString(dts.animal_model) );

                // Push gene name again instead
                row.push("<a href=" + geneDiseaseLoc + ">" + data[i].label + "</a>");

                newData[i] = row;

            }


            // now set the table content:

            // first, clear any existing content
            table.clear();

            // now here would be a good place to hide/show any columns based on datatypes ??
            for(var i=3; i<table.columns()[0].length-1; i++){
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
                //scope.$watch(function(){return scope.data}, function(n,o){
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
    // .directive('pmcCitationList', function () {
    // 'use strict';
    //
    // var pmc = require ('biojs-vis-pmccitation');
    //     return {
    //         restrict: 'E',
    //         templateUrl: "partials/pmcCitation.html",
    //         link: function (scope, elem, attrs) {
    //             scope.$watch(function () { return attrs.pmids;}, function (newPMIDs) {
    //                 if (!newPMIDs) {
    //                     return;
    //                 }
    //                 var pmids = newPMIDs.split(",");
    //                 if (pmids[0]) {
    //                     var terms = [];
    //                     for (var i=0; i<pmids.length; i++) {
    //                         terms.push("EXT_ID:" + pmids[i]);
    //                     }
    //                     var query = terms.join(" OR ");
    //                     var config = {
    //                         width: 800,
    //                         //proxyUrl: '/proxy/',
    //                         loadingStatusImage: "",
    //                         source: pmc.Citation.MED_SOURCE,
    //                         query: query,
    //                         target: 'pmcCitation',
    //                         displayStyle: pmc.CitationList.FULL_STYLE,
    //                         elementOrder: pmc.CitationList.TITLE_FIRST
    //                     };
    //                     var instance = new pmc.CitationList(config);
    //                     instance.load();
    //                 }
    //             });
    //         }
    //     };
    // })
    //


    /*
     *
     */
    //  .directive('pmcCitation', function () {
    //      return {
    //          restrict: 'E',
    //          templateUrl: "partials/pmcCitation.html",
    //          link: function (scope, elem, attrs) {
    //              var pmc = require ('biojs-vis-pmccitation');
    //              var config = {
    //                  source: pmc.Citation.MED_SOURCE,
    //                  citation_id: attrs.pmcid,
    //                  width: 400,
    //                  proxyUrl: 'https://cors-anywhere.herokuapp.com/',
    //                  displayStyle: pmc.Citation.FULL_STYLE,
    //                  elementOrder: pmc.Citation.TITLE_FIRST,
    //                  target : 'pmcCitation',
    //                  showAbstract : false
    //              };
    //              var instance = new pmc.Citation(config);
    //              instance.load();
    //          }
    //      };
    //  })



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
    // .directive('cttvTargetTranscripts', ['cttvAPIservice', function (cttvAPIservice) {
    // return {
    //     restrict: 'E',
    //     scope : {
    //     },
    //     link: function (scope, elem, attrs) {
    //     var w = elem[0].parentNode.offsetWidth - 40;
    //     scope.$watch (function () { return attrs.target }, function (target) {
    //         if (target === "") {
    //         return;
    //         }
    //         var newDiv = document.createElement("div");
    //         newDiv.id = "cttvTargetTranscriptView";
    //         elem[0].appendChild(newDiv);

    //         var tV = tnt.transcript()
    //         .width(w)
    //         .gene(target);
    //         var tvTheme = targetTranscriptView();
    //         tvTheme (tV, cttvAPIservice.getSelf(), document.getElementById("cttvTargetTranscriptView"));
    //     });
    //     }
    // };
    // }])



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

                    var instance = AtlasHeatmapModule.build ({
                        gxaBaseUrl: '/proxy/www.ebi.ac.uk/gxa',
                        //gxaBaseUrl : '/gxa',
                        params:'geneQuery=' + target + "&species=homo%20sapiens",
                        isMultiExperiment: true,
                        target : "cttvExpressionAtlas"
                    });
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
                        //.range(["#80bbd7", "#2383BA"]);
                        //.range(["#DDDDDD","#A3CEE2", "#2383BA"]);

                        //.range(["#FFFF00", "#FF982A"]); // amber-red
                        //.range(["#5CE62E", "#40A120"]);    // green
                        //.range(["#a6bddb", "#045a8d"]);
                        //.range(["#eff3ff","#2171b5"])
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
                                    gene: scope.target
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
     * A directive for Checkbox facets.
     * Checkboxes can also have nested checkboxes...
     */
    .directive('cttvCheckboxFacet', ['$log', 'cttvAPIservice', 'cttvFiltersService' , function ($log, cttvAPIservice, cttvFiltersService) {
        'use strict';

        return {

            restrict: 'EA',

            scope: {
            },
            //templateUrl: 'partials/facets.html',

            link: function (scope, elem, attrs) {},

            // controller: function(scope){
            //
            // }

        };

    }])



    /**
     * This directive exposes the page scroll, so it can for example
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
