
    /* Controllers */

    angular.module('cttvControllers')



    /**
       * GeneDiseaseCtrl
       * Controller for the Gene <-> Disease page
       * It loads the evidence for the given target <-> disease pair
    */
    .controller('TargetDiseaseCtrl', ['$scope', '$location', '$log', 'cttvAPIservice', 'cttvUtils', 'cttvDictionary', 'cttvConsts', 'clearUnderscoresFilter', '$modal', '$compile', '$http', '$q', function ($scope, $location, $log, cttvAPIservice, cttvUtils, cttvDictionary, cttvConsts, clearUnderscores, $modal, $compile, $http, $q) {
        'use strict';
        $log.log('TargetDiseaseCtrl()');

        var dbs = cttvConsts.dbs;
        var datatypes = cttvConsts.datatypes;

        $scope.search = {
            info : {
                data : {},
                efo_path : [],
                efo : {},
                gene : {},
                title : ""
            },

            flower_data : [], // processFlowerData([]), // so we initialize the flower to something
            test:[],
            categories:[],   // use this for sections of the accordion and flower petals
            association_scores : {},

            // tables data:
            genetic_associations : {
                is_open : false,
                is_loading: false,
                common_diseases : {
                    data : [],
                    is_open : false,
                    is_loading: false
                },
                rare_diseases : {
                    data : [],
                    is_open : false,
                    is_loading: false
                }
            },
            rna_expression : {
                data : [],
                is_open : false,
                is_loading: false
            },
            pathways : {
                data : [],
                is_open : false,
                is_loading: false
            },
            drugs : {
                data : [],
                is_open : false,
                is_loading: false
            },
            somatic_mutations : {
                data : [],
                is_open : false,
                is_loading: false
            },
            literature : {
                data : [],
                is_open : false,
                is_loading: false
            },
            mouse : {
                data : [],
                is_open : false,
                is_loading: false
            },
        };

        $scope.datatypes = datatypes;





        // =================================================
        //  I N F O
        // =================================================



        /**
         * Get the information for target and disease,
         * i.e. to fill the two boxes at the top of the page
         */
        var getInfo = function(){
            $log.log("getInfo for "+$scope.search.target + " & " + $scope.search.disease);

            // get gene specific info
            cttvAPIservice.getTarget( {
                    target_id:$scope.search.target
                } ).
                then(
                    function(resp) {
                        $log.warn(resp);
                        $scope.search.info.gene = resp.body;
                        updateTitle();
                    },
                    cttvAPIservice.defaultErrorHandler
                );


            // get disease specific info with the efo() method
            cttvAPIservice.getDisease( {
                    code:$scope.search.disease
                } ).
                then(
                    function(resp) {
                        $log.warn(resp);
                        $scope.search.info.efo = resp.body;
                        // TODO: This is not returned by the api yet. Maybe we need to remove it later
                        $scope.search.info.efo.efo_code = $scope.search.disease;
                        updateTitle();
                    },
                    cttvAPIservice.defaultErrorHandler
                );

        };



        var updateTitle = function(){
            $scope.search.info.title = (($scope.search.info.gene.approved_symbol || $scope.search.info.gene.ensembl_external_name)+"-"+$scope.search.info.efo.label).split(" ").join("_");
        };



        // =================================================
        //  F L O W E R
        // =================================================



        function lookDatasource (arr, dsName) {
            for (var i=0; i<arr.length; i++) {
               if (arr[i].datatype === dsName) {
                   return {
                       "count": arr[i].evidence_count,
                       "score": arr[i].association_score
                   };
               }
            }
            return {
               "count": 0,
               "score": 0
            };
        }



        /*
         * takes a datasources array and returns an array of objects {value: number, label:string}
         */
        function processFlowerData(data){
            var fd = [];

            for (var i=0; i<cttvConsts.datatypesOrder.length; i++) {
                var key = cttvConsts.datatypesOrder[i];
                fd.push({
                    "value": lookDatasource(data, cttvConsts.datatypes[key]).score,
                    "label": cttvConsts.datatypesLabels[key]
                });
            }

            return fd;
        }



        var getFlowerData = function(){
            $log.log("getFlowerData()");

            return cttvAPIservice.getAssociation({
                    target:$scope.search.target,
                    disease:$scope.search.disease,
                    expandefo: true,
                    facets: false
                }).
                then(
                    function(resp) {
                        $log.log("getFlowerData response");
                        $scope.search.flower_data = processFlowerData(resp.body.data[0].datatypes);
                        for(var i=0; i<resp.body.data[0].datatypes.length; i++){
                            $scope.search.association_scores[resp.body.data[0].datatypes[i].datatype] = resp.body.data[0].datatypes[i].association_score;
                        }
                    },
                    cttvAPIservice.defaultErrorHandler
                );
        };



        // =================================================
        //  G E N E T I C   A S S O C I A T I O N S
        // =================================================



        /*
        Here we need to pull data for two tables via two separte, distinct calls to the API
         - common disease table
         - related rare disease
        */


        // -------------------------------------------------



        var updateGeneticAssociationsSetting = function(){
            $scope.search.genetic_associations.is_open = $scope.search.genetic_associations.common_diseases.is_open || $scope.search.genetic_associations.rare_diseases.is_open;
            $scope.search.genetic_associations.is_loading = $scope.search.genetic_associations.common_diseases.is_loading || $scope.search.genetic_associations.rare_diseases.is_loading;
        };



        /*
         * Search for given eco_code id in the specified evidence_codes_info array
         * and returns corresponding label, or eco_code id if not found
         */
        var getEcoLabel = function(arr, eco){
            var label = eco;
            for(var i=0; i<arr.length; i++){
                if(arr[i][0].eco_id===eco){
                    label = arr[i][0].label;
                    break;
                }
            }
            return label;
        };



        // var getSoLabel = function(arr_info, arr_code){
        //     var label = "nearest_gene_five_prime_end";
        //     // first look for the SO id in the array
        //     for(var i=0; i<arr_code.length; i++){
        //         if(arr_code[i].substr(0,2).toUpperCase() === "SO"){
        //             label = getEcoLabel( arr_info, arr_code[i]);
        //             break;
        //         }
        //     }
        //     return label;
        // }



        var getCommonDiseaseData = function(){
            $scope.search.genetic_associations.common_diseases.is_loading = true;
            return cttvAPIservice.getFilterBy( {
                    target:$scope.search.target,
                    disease:$scope.search.disease,
                    size: 1000,
                    datasource: dbs.GWAS,
                    fields:[
                        "disease",
                        "evidence",
                        "variant",
                        "target",
                        "sourceID"
                    ]
                } ).
                then(
                    function(resp) {
                        $scope.search.genetic_associations.common_diseases.data = resp.body.data;
                        initCommonDiseasesTable();

                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    //$scope.search.genetic_associations.common_diseases.is_open = $scope.search.genetic_associations.common_diseases.data.length>0 || false;
                    $scope.search.genetic_associations.common_diseases.is_loading = false;

                    // update for parent
                    updateGeneticAssociationsSetting();
                });
        };



        /*
         *
         */
        var formatCommonDiseaseDataToArray = function(data){
            var newdata = [];
            //for(var i=0; i<data.length; i++){
            data.forEach(function(item){

                // create rows:
                var row = [];

                try{

                    // disease
                    row.push( item.disease.efo_info[0].label );

                    // Variant
                    row.push( "<a href='http://www.ensembl.org/Homo_sapiens/Variation/Explore?v="+item.variant.id[0].split('/').pop()+"' target='_blank'>"+item.variant.id[0].split('/').pop()+"&nbsp;<i class='fa fa-external-link'></i></a>" );

                    // variant type
                    row.push( clearUnderscores( getEcoLabel(item.evidence.evidence_codes_info, item.evidence.gene2variant.functional_consequence.split('/').pop() ) ) );


                    // evidence source
                    row.push( cttvDictionary.CTTV_PIPELINE );

                    // evidence source
                    row.push( "<a href='https://www.ebi.ac.uk/gwas/search?query="+item.variant.id[0].split('/').pop()+"' target='_blank'>"
                            + clearUnderscores(item.sourceID)
                            + "&nbsp;<i class='fa fa-external-link'></i></a>");


                    // p-value
                    row.push( item.evidence.variant2disease.resource_score.value.toPrecision(1) );

                    // publications
                    var pub="";
                    if( checkPath(item, "evidence.variant2disease.provenance_type.literature.references")){
                        pub=item.evidence.variant2disease.provenance_type.literature.references.map(function(ref){
                            return "<a href='"+ref.lit_id+"' target='_blank'>"+ref.lit_id.split('/').pop()+" <i class='fa fa-external-link'></i></a>"
                        }).join(", ");
                    }
                    row.push(pub);

                    newdata.push(row);
                }catch(e){
                    $log.error("Error parsing common disease data:");
                    $log.error(e);
                }
            });

            return newdata;
        };



        var initCommonDiseasesTable = function(){

            $('#common-diseases-table').dataTable( cttvUtils.setTableToolsParams({
                "data": formatCommonDiseaseDataToArray($scope.search.genetic_associations.common_diseases.data),
                //"ordering" : true,
                //"order": [[3, 'des']],
                "autoWidth": false,
                "paging" : true
            }, $scope.search.info.title+"-common_diseases") );
        };



        // -------------------------------------------------



        var getRareDiseaseData = function(){
            $scope.search.genetic_associations.rare_diseases.is_loading = true;
            return cttvAPIservice.getFilterBy( {
                    target:$scope.search.target,
                    disease:$scope.search.disease,
                    size: 1100,
                    datasource: [dbs.UNIPROT, dbs.EVA ],
                    fields: [
                        "disease.efo_info",
                        "evidence",
                        "variant",
                        "type"
                    ]
                } ).
                then(
                    function(resp) {
                        $scope.search.genetic_associations.rare_diseases.data = resp.body.data;
                        initRareDiseasesTable();
                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    //$scope.search.genetic_associations.rare_diseases.is_open = $scope.search.genetic_associations.rare_diseases.data.length>0 || false;
                    $scope.search.genetic_associations.rare_diseases.is_loading = false;
                    // update for parent
                    updateGeneticAssociationsSetting();
                });
        };



        var formatRareDiseaseDataToArray = function(data){
            var newdata = [];
            data.forEach(function(item){
                // create rows:
                var row = [];

                try{

                    var db = "";
                    if( item.evidence.variant2disease ){
                        db = item.evidence.variant2disease.provenance_type.database.id.toLowerCase();   // or gene2variant
                    }else if ( item.evidence.provenance_type.database ){
                        db = item.evidence.provenance_type.database.id.toLowerCase();
                    }

                    // disease
                    row.push( item.disease.efo_info[0].label );


                    // mutation
                    var mut = cttvDictionary.NA;
                    if( checkPath(item, "variant.id") && item.variant.id[0]){
                        var rsId = item.variant.id[0].split('/').pop();
                        mut = "<a href=http://www.ensembl.org/Homo_sapiens/Variation/Explore?v=" + rsId + " target=_blank>" + rsId + " <i class='fa fa-external-link'></i></a>";
                    }
                    row.push(mut);



                    // mutation consequence
                    if( item.type === 'genetic_association' ){
                        //row.push( item.evidence.gene2variant.functional_consequence ); // TODO: pull label from new data
                        row.push( clearUnderscores( getEcoLabel(item.evidence.evidence_codes_info, item.evidence.gene2variant.functional_consequence.split('/').pop() ) ) );
                    } else if( item.type === 'somatic_mutation' ){
                        row.push( clearUnderscores(item.type) );
                    } else {
                        row.push( "Curated evidence" );
                    }


                    // evidence source
                    if( item.type === 'genetic_association' ){
                        row.push( "<a href='" + item.evidence.variant2disease.urls[0].url + "' target=_blank>" + item.evidence.variant2disease.urls[0].nice_name + " <i class='fa fa-external-link'></i></a>" );
                    } else {
                        row.push( "<a href='" + item.evidence.urls[0].url + "' target=_blank>" + item.evidence.urls[0].nice_name + " <i class='fa fa-external-link'></i></a>" );
                    }



                    // publications
                    var pub="";
                    if( item.type === 'genetic_association' ){
                        if (item.evidence.variant2disease.provenance_type.literature) {
                            pub = item.evidence.variant2disease.provenance_type.literature.references.map(function(ref){
                                return "<a href='"+ref.lit_id+"' target='_blank'>"+(ref.lit_id.split('/').pop())+" <i class='fa fa-external-link'></i></a>";
                            }).join(", ");
                        }
                    } else {
                        $log.log(item.evidence);
                        pub = item.evidence.provenance_type.literature.references.map(function(ref){
                            return "<a href='"+ref.lit_id+"' target='_blank'>"+(ref.lit_id.split('/').pop())+" <i class='fa fa-external-link'></i></a>";
                        }).join(", ");
                    }
                    row.push( pub );

                    // add the row to data
                    newdata.push(row);


                }catch(e){
                    $log.warn("Error parsing rare disease data:");
                    $log.warn(e);
                }
            });

            return newdata;
        };



        var initRareDiseasesTable = function(){

            $('#rare-diseases-table').dataTable( cttvUtils.setTableToolsParams({
                "data": formatRareDiseaseDataToArray($scope.search.genetic_associations.rare_diseases.data),
                "autoWidth": false,
                "paging" : true
            }, $scope.search.info.title+"-rare_diseases") );
        };



        // =================================================
        //  D R U G S
        // =================================================

            /*
            drug    1   Target context  .biological_subject.properties.target_type
            drug    2   Protein complex members .biological_subject.about
            drug    3   Drug information    .evidence.evidence_chain[0].evidence.experiment_specific
            drug    4   Mechanism of action of drug .biological_subject.properties.activity
            drug    5   Mechanism of action references  .evidence.evidence_chain[0].evidence.provenance_type.literature.pubmed_refs
            drug    6   Evidence codes: target to drug  .evidence.evidence_chain[0].evidence.evidence_codes
            drug    7   Provenance - target .evidence.urls.linkouts[1]
            drug    8   Provenance - drug   .evidence.urls.linkouts[0]
            drug    9   Provenace - marketed drug indication; SourceDB  .evidence.evidence_chain[1].evidence.experiment_specific
            drug    10  Date asserted   .evidence.date_asserted
            drug    11  Evidence codes: drug to disease .evidence.evidence_chain[1].evidence.evidence_codes
            drug    12  Association score   .evidence.evidence_chain[0].evidence.association_score
            */

            /*
            Drug Information                                                        Gene-Drug Evidence
            Drug    Phase   Type    Mechanism of Action Activity    Clinical Trials Target name Target class    Target context  Protein complex members Evidence type
            */

        var getDrugData = function(){
            $scope.search.drugs.is_loading = true;
            return cttvAPIservice.getFilterBy( {
                    target:$scope.search.target,
                    disease:$scope.search.disease,
                    size: 1000,
                    datasource: dbs.CHEMBL,
                    fields: [
                        "disease.efo_info",
                        "drug",
                        "evidence",
                        "target",
                    ]
                } ).
                then(
                    function(resp) {
                        $scope.search.drugs.data = resp.body.data;
                        initTableDrugs();

                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    //$scope.search.drugs.is_open = $scope.search.drugs.data.length>0 || false;
                    $scope.search.drugs.is_loading = false;
                });
        };


        var formatDrugsDataToArray = function(data){
            var newdata = [];
            data.forEach(function(item){
                // create rows:
                var row = [];

                try{

                    // 0: disease
                    row.push(item.disease.efo_info[0].label);

                    // 1: drug
                    row.push( "<a href='"+item.evidence.target2drug.urls[0].url+"' target='_blank'>"
                            + item.drug.molecule_name
                            + " <i class='fa fa-external-link'></i></a>");

                    // 2: phase
                    row.push(item.drug.max_phase_for_all_diseases.label);

                    // 2: hidden
                    row.push(item.drug.max_phase_for_all_diseases.numeric_index);

                    // 3: type
                    row.push(item.drug.molecule_type);

                    // 4: Mechanism of action
                    var pubs = 0;
                    if( checkPath(item, "evidence.target2drug.provenance_type.literature.references") ){
                        pubs = item.evidence.target2drug.provenance_type.literature.references.length
                    }

                    var action = item.evidence.target2drug.mechanism_of_action;

                    // publications:
                    // we show the publications here in the cells for now
                    // eventually this should be in a popup or tooltip of some sort
                    var pub="";
                    if( pubs>0 ){
                        action += "<br /><span><span class='badge'>" + pubs + (pubs==1 ? "</span> publication</span>" : "</span> publications</span>");
                        pub=":<div>";
                        item.evidence.target2drug.provenance_type.literature.references.forEach(function(lit){
                            pub+="<a href='"+lit.lit_id+"' target='_blank'>"+lit.lit_id.split('/').pop()+" <i class='fa fa-external-link'></i></a> "
                        });
                        pub+="</div>";

                    }

                    if ( item.evidence.target2drug.urls && item.evidence.target2drug.urls[2] ) {
                        var extLink = item.evidence.target2drug.urls[2];
                        pub += "<br /><span><a target=_blank href=" + extLink.url + ">" + extLink.nice_name  + "</a></span>";
                    }

                    action+=pub;

                    row.push(action);


                    // 5: Activity
                    var activity = item.target.activity;
                    switch (activity) {
                        case 'drug_positive_modulator' :
                            activity = "agonist";
                            break;
                        case 'drug_negative_modulator' :
                            activity = "antagonist";
                            break;
                    }
                    row.push(activity);

                    // 6: Clinical indications -- REMOVED!
                    // row.push( "<a href='"
                    //             + data[i].evidence.evidence_chain[1].evidence.experiment_specific.urls[0].url
                    //             + "' target='_blank'>" + data[i].evidence.evidence_chain[1].evidence.experiment_specific.urls[0].nice_name + " <i class='fa fa-external-link'></i></a>");

                    // 7: target class
                    row.push(item.target.target_class[0]);


                    // 8: target context / protein complex members

                    /*var prot="";
                    var prots = []
                    if (item.target.gene_info.length > 1) {
                        prot += "complex:<br/>";
                    } else {
                        prot += "protein:<br/>";
                    }
                    if(item.target.gene_info){
                        for(var j=0; j<item.target.gene_info.length; j++){
                            prots.push("<a href='/target/"+item.target.gene_info[j].geneid
                                +"/associations' title='"+item.target.gene_info[j].name+"'>"
                                +item.target.gene_info[j].symbol
                                +"</a>");
                            // prot+="<a href='#/target/"+data[i].biological_subject.gene_info[j].geneid
                            //     +"/associations' title='"+data[i].biological_subject.gene_info[j].name+"'>"
                            //     +data[i].biological_subject.gene_info[j].symbol
                            //     +"</a>, "
                        }
                    }
                    prot += prots.join (", ");

                    row.push(prot);
                    */

                    // 9: evidence source
                    row.push( "Curated from <br /><a href='"
                                + item.evidence.drug2clinic.urls[0].url
                                + "' target='_blank'>" + item.evidence.drug2clinic.urls[0].nice_name + " <i class='fa fa-external-link'></i></a>");

                    //row.push(data[i].evidence.evidence_codes_info[0][0].label);    // Evidence codes


                    newdata.push(row); // use push() so we don't end up with empty rows
                }catch(e){
                    $log.log("Error parsing drugs data:");
                    $log.log(e);
                }
            });
            return newdata;
        }



        /*
         * This is the hardcoded data for the Known Drugs table and
         * will obviously need to change and pull live data when available
         */
        var initTableDrugs = function(){
            $('#drugs-table').dataTable( cttvUtils.setTableToolsParams({
                "data": formatDrugsDataToArray($scope.search.drugs.data),
                "autoWidth": false,
                "paging": true,
                "order" : [[2, "desc"]],
                "aoColumnDefs" : [
                    {"targets": [3], "visible":false},
                    {"iDataSort" : 2, "aTargets" : [3]},
                ],
                // "aoColumnDefs" : [
                //     {"iDataSort" : 2, "aTargets" : [3]},
                // ]
                //"ordering": false
            }, $scope.search.info.title+"-known_drugs") );

        }



        // =================================================
        //  PATHWAYS
        // =================================================

            /*
            pathway 1   Target context  .biological_subject.properties.target_type
            pathway 2   Protein complex members .biological_subject.about
            pathway 3   Activity    .biological_subject.properties.activity
            pathway 4   Additional context  .evidence.properties.experiment_specific.additional_properties
            pathway 5   Provenance - SourceDB   .evidence.urls.linkouts
            pathway 6   Provenance - References .evidence.provenance_type.literature.pubmed_refs
            pathway 7   Date asserted   .evidence.date_asserted
            pathway 8   Evidence codes  .evidence.evidence_codes
            */



        var getPathwaysData = function(){
            $scope.search.pathways.is_loading = true;
            return cttvAPIservice.getFilterBy( {
                    target:$scope.search.target,
                    disease:$scope.search.disease,
                    size: 1000,
                    datasource: dbs.REACTOME,
                    fields: [
                        "target",
                        "disease",
                        "evidence"
                    ]
                } ).
                then(
                    function(resp) {
                        $scope.search.pathways.data = resp.body.data;
                        initTablePathways();
                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    //$scope.search.pathways.is_open = $scope.search.pathways.data.length>0 || false; // might trigger an error...
                    $scope.search.pathways.is_loading = false;
                });
        }



        /*
         *
         */
        var formatPathwaysDataToArray = function(data){
            var newdata = [];
            data.forEach(function(item){
                // create rows:
                var row = [];

                try{

                    // disease
                    row.push(item.disease.efo_info[0].label);

                    // overview
                    row.push("<a href='" + item.evidence.urls[0].url+"' target='_blank'>" + item.evidence.urls[0].nice_name + " <i class='fa fa-external-link'></i></a>");

                    // activity
                    row.push( cttvDictionary[item.target.activity.toUpperCase()] || clearUnderscores(item.target.activity) ); // "up_or_down"->"unclassified" via dictionary

                    // mutations
                    row.push(item.evidence.known_mutations || cttvDictionary.NA);

                    // evidence codes
                    row.push("Curated in " + item.evidence.provenance_type.database.id );

                    // publications
                    var pub=cttvDictionary.NA;
                    if( checkPath(item, "evidence.provenance_type.literature.references") ){
                        pub=item.evidence.provenance_type.literature.references.map(function(ref){
                            return "<a href='"+ref.lit_id+"' target='_blank'>"+ref.lit_id.split('/').pop()+"&nbsp;<i class='fa fa-external-link'></i></a>"
                        }).join(", ");

                    }
                    row.push(pub);



                    newdata.push(row); // use push() so we don't end up with empty rows

                }catch(e){
                    $log.error("Error parsing pathways data:");
                    $log.error(e);
                }
            });
            return newdata;
        };



        var initTablePathways = function(){
            $('#pathways-table').dataTable( cttvUtils.setTableToolsParams({
                "data" : formatPathwaysDataToArray($scope.search.pathways.data),
                //"ordering" : true,
                "autoWidth": false,
                "paging" : true
            }, $scope.search.info.title+"-disrupted_pathways") );
        };



        // =================================================
        //  RNA expression
        // =================================================



        var getRnaExpressionData = function(){
            $scope.search.rna_expression.is_loading = true;
            return cttvAPIservice.getFilterBy( {
                    target:$scope.search.target,
                    disease:$scope.search.disease,
                    size: 1000,
                    datasource: dbs.EXPRESSION_ATLAS,
                    fields: [
                        "disease",
                        "evidence",
                        "target"
                    ]
                } ).
                then(
                    function(resp) {
                        $scope.search.rna_expression.data = resp.body.data;
                        initTableRNA();

                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    //$scope.search.rna_expression.is_open = $scope.search.rna_expression.data.length>0 || false;
                    $scope.search.rna_expression.is_loading = false;
                });
        };



        /*
         * Takes the data object returned by the API and formats it to an array of arrays
         * to be displayed by the RNA-expression dataTable widget.
         */
        var formatRnaDataToArray = function(data){
            var newdata = [];
            data.forEach(function(item){
                // create rows:
                var row = [];

                try{

                    // disease
                    row.push( item.disease.efo_info[0].label );

                    // comparison
                    row.push( item.evidence.comparison_name );

                    // activity
                    var activityUrl = item.evidence.urls[0].url;
                    var activity = item.target.activity.split("_").shift();
                    row.push( "<a href='"+ activityUrl +"' target='_blank'>" + activity +"<i class='fa fa-external-link'></i></a>" );

                    // tissue / cell
                    row.push( item.disease.biosample.name );
                    // row.push( checkPath(data[i], "biological_object.properties.biosamples") ? data[i].biological_object.properties.biosamples : cttvDictionary.NA );

                    // evidence source
                    row.push( getEcoLabel( item.evidence.evidence_codes_info, item.evidence.evidence_codes[0]) );

                    // fold change
                    row.push( item.evidence.log2_fold_change.value );

                    // p-value
                    row.push( item.evidence.resource_score.value );

                    // percentile rank
                    row.push( item.evidence.log2_fold_change.percentile_rank );

                    // experiment overview
                    row.push( "<a href='"+item.evidence.urls[2].url+"' target='_blank'>" + (item.evidence.experiment_overview || "Experiment overview and raw data") + " <i class='fa fa-external-link'></i></a>" );

                    // publications
                    var pub="";
                    if (item.evidence.provenance_type.literature) {
                        pub = item.evidence.provenance_type.literature.references.map(function(ref){
                            return "<a href='" + ref.lit_id +"' target='_blank'>"+ ref.lit_id.split('/').pop() +"&nbsp;<i class='fa fa-external-link'></i></a>"
                        }).join(", ");
                    }
                    row.push(pub);

                    newdata.push(row); // push, so we don't end up with empty rows

                }catch(e){
                    $log.log("Error parsing RNA-expression data:");
                    $log.log(e);
                }
            });
            //}

            return newdata;
        };



        var initTableRNA = function(){

            $('#rna-expression-table').dataTable( cttvUtils.setTableToolsParams({
                "data": formatRnaDataToArray($scope.search.rna_expression.data),
                "autoWidth": false,
                "paging" : true
            }, $scope.search.info.title+"-RNA_expression") );
        };



        // =================================================
        //  S O M A T I C   M U T A T I O N S
        // =================================================



        var getMutationData = function(){
            $log.log("getMutationData()");
            $scope.search.somatic_mutations.is_loading = true;
            return cttvAPIservice.getFilterBy( {
                    target:$scope.search.target,
                    disease:$scope.search.disease,
                    size: 1000,
                    datasource: [dbs.CANCER_GENE_CENSUS/*, dbs.EVA()*/],    // TODO: pull EVA data too, when it's ready
                    fields: [
                        "disease.efo_info", // disease
                        "evidence.evidence_codes_info",  // evidence source
                        "evidence.urls",
                        "evidence.known_mutations",
                        "evidence.provenance_type"
                    ]
                } ).
                then(
                    function(resp) {
                        $scope.search.somatic_mutations.data = resp.body.data;
                        initTableMutations();

                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    //$scope.search.somatic_mutations.is_open = $scope.search.somatic_mutations.data.length>0 || false;
                    $scope.search.somatic_mutations.is_loading = false;
                });
        }



        /*
         *
         */
        var formatMutationsDataToArray = function(data){
            var newdata = [];
            data.forEach(function(item){
                var row = [];
                try{

                    // col 0: disease
                    row.push(item.disease.efo_info[0].label);

                    // col 1: know mutations
                    row.push(item.evidence.known_mutations);

                    // col 2: evidence source
                    row.push("<a href='"+item.evidence.urls[0].url+"' target='_blank'>"+item.evidence.urls[0].nice_name+" <i class='fa fa-external-link'></i></a>");

                    // cols 3: publications

                    var pub=cttvDictionary.NA;
                    if( checkPath(item, "evidence.provenance_type.literature.references") ){
                        pub=item.evidence.provenance_type.literature.references.map(function(ref){
                            return "<a href='"+ref.lit_id+"' target='_blank'>"+ref.lit_id.split('/').pop()+"&nbsp;<i class='fa fa-external-link'></i></a>"
                        }).join(", ");

                    }
                    row.push(pub);


                    newdata.push(row); // push, so we don't end up with empty rows
                }catch(e){
                    $log.log("Error parsing somatic mutation data:");
                    $log.log(e);
                }
            })

            return newdata;
        }



        var initTableMutations = function(){

            $('#mutations-table').dataTable( cttvUtils.setTableToolsParams({
                "data": formatMutationsDataToArray($scope.search.somatic_mutations.data),
                //"ordering" : true,
                //"order": [[3, 'des']],
                "autoWidth": false,
                "paging" : true
            }, $scope.search.info.title+"-somatic_mutations") );
        }



        // =================================================
        //  M O U S E   D A T A
        // =================================================

        /*
        Probability:
        evidence.association_scrore.probability.value

        Mouse phenotypes:
        show the values for each key (e.g. circling, imapired balance, deafness, etc)
        evidence.properties.evidence_chain[1].biological object.properties.experiment_specific

        Human phenotypes:
        same as for moouse phenotypes
        biological object.properties.experiment specific
        */

        var getMouseData = function(){
            $scope.search.mouse.is_loading = true;
            return cttvAPIservice.getFilterBy( {
                    target:$scope.search.target,
                    disease:$scope.search.disease,
                    size: 1000,
                    datasource: dbs.PHENODIGM,
                    fields: [
                        "disease",
                        "evidence",
                        "scores"
                    ]
                } ).
                then(
                    function(resp) {
                        $scope.search.mouse.data = resp.body.data;
                        initTableMouse();
                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    //$scope.search.mouse.is_open = $scope.search.mouse.data.length>0 || false;
                    $scope.search.mouse.is_loading = false;
                });
        }



        /*
         *
         */
        var formatMouseDataToArray = function(data){
            var newdata = [];
            data.forEach(function(item){
                // create rows:
                var row = [];

                try{
                    // disease
                    row.push(item.disease.efo_info[0].label);    // or item.disease.efo_info[0].label ???

                    // human
                    row.push( "<ul>" + item.evidence.disease_model_association.human_phenotypes.map(function(hp){return "<li>"+hp.label+"</li>"}).join("") + "</ul>" );

                    // mouse
                    row.push( "<ul>" + item.evidence.disease_model_association.model_phenotypes.map(function(hp){return "<li>"+hp.label+"</li>"}).join("") + "</ul>" );

                    // mouse model
                    var mousemodel = processMouseModelLinks( item.evidence.biological_model.allelic_composition, item.evidence.biological_model.allele_ids )
                                     + "<br/ >"
                                     + "<span class='small text-lowlight'>"+item.evidence.biological_model.genetic_background+"</span>"
                    row.push(mousemodel);


                    // evidence source
                    row.push("Phenodigm");

                    // score
                    row.push((item.scores.association_score).toFixed(2));


                    newdata.push(row); // push, so we don't end up with empty rows
                }catch(e){
                    $log.error("Error parsing mouse data:");
                    $log.error(e);
                }
            });

            return newdata;
        };



        var initTableMouse = function(){

            $('#mouse-table').dataTable( cttvUtils.setTableToolsParams({
                "data": formatMouseDataToArray($scope.search.mouse.data),
                "autoWidth": false,
                "paging" : true,
                "ordering" : true,
                "order": [[5, 'des']]
            }, $scope.search.info.title+"-mouse_models") );
        };



        /*
         * Takes a string like "Casr<Nuf>/Casr<+>" and returns "Casr<sup>Nuf</sup>/Casr<sup>+</sup>"
         */
        var processMouseModelData = function(mmd){
            return mmd.replace(/<(.*?)>/g, function(match){return "<sup>"+match.substr(1,match.length-2)+"</sup>";});
        };



        /*
         * Takes a string like "Casr<Nuf>/Casr<+>" and a string of ids like "MGI:3054788|MGI:3054788"
         * returns the original string with <a href> tags around each part "Casr<Nuf>" and "Casr<+>"
         */
        var processMouseModelLinks = function(mmd, id){
            var mmds = mmd.split("/");
            var ids = id.split("|");
            for(var i=0; i<mmds.length; i++){
                if(ids[i]){
                    mmds[i] = "<a href='http://informatics.jax.org/accession/"+ids[i]+"' target='_blank'>" + processMouseModelData(mmds[i]) + "</a>";
                }
            }
            return mmds.join("/");
        }



        // =================================================
        //  L I T E R A T U R E
        // =================================================

        /*
        Literature data for the "Text mining" table. Table fields are:
          - Disease: disease name (string)
          - Publication: publication description (string, long text)
          - Matched sentences: the number of them (number)
          - Year: number
        */

        function parseResponse (recs, dt) {
            /*var r = dt.row( function ( idx, data, node ) {
                return data[1] === '9188529' ? true : false;
            });
            $log.log(r.data());
            var d = r.data();
            d[2] = "hello literature";
            r.data(d);
            dt.draw();
            */

            dt.rows().every( function ( rowIdx, tableLoop, rowLoop ) {
                var data = this.data();
                // ... do something with data(), or this.node(), etc
                //data[1]; // the literature ID
                var pmdata = recs.filter(function(item){
                    return item.pmid == data[1];
                });

                if(pmdata.length>0){
                    // format publication data:
                    //data[2] = pmdata[0].title+"<br />"+pmdata[0].pmid;
                    var re = /abstract: (.*?)\./g;
                    data[2]="";

                    // pmdata.forEach(function(pub){
                    var pub = pmdata[0];
                    // format author names
                    var auth = pub.authorString;
                    // auth = auth.substr(0,auth.length-1);
                    auth = auth.split(",");
                    if(auth.length>1){
                        auth[0] = auth[0] + " et al.";
                    }
                    auth = auth[0];

                    var match;
                    var abstract = pub.abstractText;
                    while ((match = re.exec(data[5])) !== null) {
                        var matchedText = match[1];
                        var indexStart = abstract.indexOf(matchedText);
                        var indexEnd = indexStart + matchedText.length;
                        if (indexStart >= 0) {
                            abstract = abstract.slice(0, indexStart) + '<b>' + abstract.slice(indexStart, indexEnd) + '</b>' + abstract.slice(indexEnd);
                        }
                    }


                    data[2] += "<a target=_blank href='http://europepmc.org/abstract/MED/"+pub.pmid+"'>"+pub.title+"</a>"
                    + "<br />"
                    + "<span class='small'>"+auth +" "+( pub.journalInfo.journal.medlineAbbreviation || pub.journalInfo.journal.title)+"</span>"
                    + "<p class='small'>"+abstract+"</p>"

                    data[4] = pub.journalInfo.yearOfPublication;
                    // });

                }else{
                    data[2] = cttvDictionary.NA;
                }

                this.data(data);

            } );

            dt.draw();

            /*$scope.citations.count = resp.data.hitCount;
            $scope.citations.europepmcLink = "//europepmc.org/search?query=" + pmids;
            var citations = resp.data.resultList.result;
            for (var i=0; i<citations.length; i++) {
                var authorStr = citations[i].authorString;
                if (authorStr[authorStr.length-1] === ".") {
                    authorStr = authorStr.slice(0,-1);
                }
                var authors = authorStr.split(', ');
                citations[i].authors = authors;
            }
            $scope.citations.all = resp.data.resultList.result;*/

        }

        var getLiteratureData = function(){
            $scope.search.literature.is_loading = true;
            return cttvAPIservice.getFilterBy( {
                    target:$scope.search.target,
                    disease:$scope.search.disease,
                    size: 1000,
                    datasource: dbs.DISGENET,   // TODO: change to 'datatype: literature' once available in the API; for now disgenet will do the trick.
                    fields: [
                        "disease",  // take disease.efo_info[0].label and disease.efo_info[0].efo_id
                        "evidence",
                        "scores"
                    ]
                } ).
                then(
                    function(resp) {
                        var all = [];
                        resp.body.data.map (function (paper) {
                            all.push(paper.evidence.literature_ref.lit_id.split("/").pop());
                        });
                        $scope.search.literature.data = resp.body.data;
                        var dt = initTableLiterature();
                        getLiteratureAbstractsData(dt);
                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    $scope.search.literature.is_loading = false;
                });
        };


        var getLiteratureAbstractsData = function(dt){
            //$scope.search.literature.data


            // var pmidsLinks = (_.map(cleanBibliography, function (p) {
            //     return "EXT_ID:" + p;
            // })).join (" OR ");
            // $scope.citations = {};


            // if ($scope.search.literature.data.length > 20) {
            //     $scope.search.literature.data = $scope.search.literature.data.slice(0, 20);
            // }

            // The expans_efo option may be retrieving the same article multiple times
            // Filter unique entries:
            var uniq = {};
            $scope.search.literature.data.map (function (rec) {
                uniq[rec.evidence.literature_ref.lit_id.split("/").pop()] = 1;
            });
            var uniqPMIDs = Object.keys(uniq);
            // Chunk!
            var chunkSize = 200;
            //var chunks = Math.ceil($scope.search.literature.data.length / chunkSize);
            var chunks = Math.ceil(uniqPMIDs.length / chunkSize);

            var callChunks = [];
            for (var i=0; i<chunks; i++) {
                //var thisRecords = $scope.search.literature.data.slice(i*chunkSize, (i+1)*chunkSize);
                var thisRecords = uniqPMIDs.slice(i*chunkSize, (i+1)*chunkSize);
                var thisPMIDs = thisRecords.map(function (id) {
                    //var id = p.evidence.literature_ref.lit_id.split("/").pop();
                    return "EXT_ID:" + id;
                }).join(" OR ");
                var url = "/proxy/www.ebi.ac.uk/europepmc/webservices/rest/search/pagesize=" + thisRecords.length + "&query=" + thisPMIDs + "&format=json&resulttype=core";
                callChunks.push($http.get(url));
            }

            $q.all(callChunks)
                .then (function (results) {
                    var allRes = [];
                    // TODO: This is inefficient since parseResponse scans the whole table. It would be better to combine all the results at this stage and call parseResponse once
                    for (var i=0; i<results.length; i++) {
                        allRes = allRes.concat(results[i].data.resultList.result);
                    }
                    parseResponse(allRes, dt);
                },
                cttvAPIservice.defaultErrorHandler
            );


            // var pmids = $scope.search.literature.data.map(function(p){
            //     return "EXT_ID:" + p.evidence.literature_ref.lit_id.split("/").pop();
            // }).join (" OR ");

            // $log.log("PMIDS:");
            // $log.log(pmids);

            // $http.get("/proxy/www.ebi.ac.uk/europepmc/webservices/rest/search/pagesize="+$scope.search.literature.data.length+"&query=" + pmids + "&format=json&resulttype=core")
            //     .then (
            //         function (resp) {
            //             parseResponse(resp, dt);
            //         },
            //         cttvAPIservice.defaultErrorHandler
            //     );
        };



        var formatLiteratureDataToArray = function(data){
            var newdata = [];
            data.forEach(function(item){
                // create rows:
                var row = [];

                try{
                    // disease
                    row.push(item.disease.efo_info[0].label);

                    // pubblication ID (hidden)
                    row.push( item.evidence.literature_ref.lit_id.split("/").pop() );

                    // publications
                    row.push( "<i class='fa fa-spinner fa-spin'></i>" );

                    // matched sentences
                    //row.push( '<button type="button" class="btn btn-default" ng-click="window.alert(\'hello\')">'+item.evidence.literature_ref.mined_sentences.length+'</button>' );
                    row.push( '<a onclick="angular.element(this).scope().open('+newdata.length+')">'+item.evidence.literature_ref.mined_sentences.length+'</a>' );

                    // year
                    row.push("<i class='fa fa-spinner fa-spin'></i>");

                    // details (hidden)
                    row.push(
                        "<ul>"+
                        item.evidence.literature_ref.mined_sentences.map(function(sent){
                            return "<li>"+sent.section+": "+sent.text+"</li>";
                        }).join("") + "</ul>"
                    );

                    newdata.push(row); // push, so we don't end up with empty rows
                }catch(e){
                    $log.error("Error parsing literature data:");
                    $log.error(e);
                }
            });

            return newdata;
        };

        $scope.open = function(id){
            //$log.log(id);
            //var row = $('#literature-table').DataTable().row(id.data()[5];
            //$log.log(row.data()[5]);
            var modalInstance = $modal.open({
              animation: true,
              //templateUrl: 'myModalContent.html',
              // template: '<cttv-modal>'+ $('#literature-table').DataTable().row(id).data()[5] +'</cttv-modal>',
              template: '<div onclick="angular.element(this).scope().$dismiss()">'
                       +'    <span class="fa fa-circle" style="position:absolute; top:-12px; right:-12px; color:#000; font-size:24px;"></span>'
                       +'    <span class="fa fa-times"  style="position:absolute; top:-8px; right:-8px; color:#FFF; font-size:16px"></span>'
                       +'</div>'
                       +'<div>'+$('#literature-table').DataTable().row(id).data()[5]+'</div>',
              //controller: 'ModalInstanceCtrl',
              size: 'lg',
              resolve: {
                items: function () {
                    return $scope.search.info;
                }
              }
            });

        };



        var initTableLiterature = function(){

            return $('#literature-table').DataTable( cttvUtils.setTableToolsParams({
                "data": formatLiteratureDataToArray($scope.search.literature.data),
                "autoWidth": false,
                "paging" : true,
                "ordering" : true,
                "order": [[4, 'desc'], [3, 'desc']],   // order by number of matched sentences
                "columnDefs" : [
                        {
                            "targets" : [1,5],
                            "visible" : false,
                        }
                    ],
            }, $scope.search.info.title+"-text_mining") );
        };



        // =================================================
        //  H E L P E R   M E T H O D S
        // =================================================



        function checkPath(obj, path){
            var prop;
            var props = path.split('.');

            while( prop = props.shift() ){
                if(!obj.hasOwnProperty(prop)){
                    return false;
                }
                obj = obj[prop];
            }
            return true;
        }







        // =================================================
        //  S C O P E   M E T H O D S
        // =================================================



        $scope.bla=function(){}



        // =================================================
        //  M A I N   F L O W
        // =================================================


        //if($location.search().t && $location.search().d){
            $log.info("target-disease-controller");
            var path = $location.path().split("/");
            $log.info(path);
            // parse parameters
            $scope.search.target = path[2];
            $scope.search.disease = path[3];



            // and fire the info search
            getInfo();

            // TODO: this is just for testing. Remove after use
            //getLiteratureData();

            // get the data for the flower graph
            getFlowerData()
                .then(function(){
                    $log.info($scope.search.association_scores);
                    // then try get some data for the tables where we know we have data...

                    if($scope.search.association_scores[datatypes.GENETIC_ASSOCIATION]){
                        getCommonDiseaseData();
                        getRareDiseaseData();
                    }
                    if($scope.search.association_scores[datatypes.SOMATIC_MUTATION]){
                        getMutationData();
                    }
                    if($scope.search.association_scores[datatypes.KNOWN_DRUG]){
                        getDrugData();
                    }
                    if($scope.search.association_scores[datatypes.RNA_EXPRESSION]){
                        getRnaExpressionData();
                    }
                    if($scope.search.association_scores[datatypes.AFFECTED_PATHWAY]){
                        getPathwaysData();
                    }
                    if($scope.search.association_scores[datatypes.LITERATURE]){
                        getLiteratureData();
                    }
                    if($scope.search.association_scores[datatypes.ANIMAL_MODEL]){
                        getMouseData();
                    }
                });

        //  }

    }]);
