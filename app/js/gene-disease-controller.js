    'use strict';

    /* Controllers */

    angular.module('cttvControllers').



    /**
       * GeneDiseaseCtrl
       * Controller for the Gene <-> Disease page
       * It loads the evidence for the given target <-> disease pair
    */
    controller('GeneDiseaseCtrl', ['$scope', '$location', '$log', 'cttvAPIservice', function ($scope, $location, $log, cttvAPIservice) {
        $log.log('GeneDiseaseCtrl()');
        
        var dbs = {
            EXPRESSION_ATLAS: "expression_atlas",
            UNIPROT: "uniprot",
            REACTOME: "reactome",
            EVA: "eva",
            PHENODIGM: "phenodigm",
            GWAS: "gwas",
            CANCER_GENE_CENSUS: "cancer_gene_census",
            CHEMBL: "chembl"
        }

        var datatypes = {
            RNA_EXPRESSION      : "rna_expression",
            KNOWN_DRUG          : "known_drug",
            GENETIC_ASSOCIATION : "genetic_association",
            ANIMAL_MODEL        : "animal_model",
            SOMATIC_MUTATION    : "somatic_mutation",
            AFFECTED_PATHWAY    : "affected_pathway",
            OTHER               : "other"
        }

        var messages = {
            NA: "N/A",
        }


        $scope.search = {
            info : {
                data : {},
                efo_path : [],
                efo : {},
                gene : {}
            },
            
            flower_data : [], // processFlowerData([]), // so we initialize the flower to something
            test:[],
            categories:[],   // use this for sections of the accordion and flower petals
            association_scores : {},

            // tables data:
            genetic_associations : {
                is_open : false,
                is_loading: true,
                common_diseases : {
                    data : [],
                    is_open : false,
                    is_loading: true
                },
                rare_diseases : {
                    data : [],
                    is_open : false,
                    is_loading: true
                }
            },
            rna_expression : {
                data : [],
                is_open : false,
                is_loading: true
            },
            pathways : {
                data : [],
                is_open : false,
                is_loading: true
            },
            drugs : {
                data : [],
                is_open : false,
                is_loading: true
            },
            somatic_mutations : {
                data : [],
                is_open : false,
                is_loading: true
            },
            mouse : {
                data : [],
                is_open : false,
                is_loading: true
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
        $scope.getInfo = function(){
            console.log("getInfo for "+$scope.search.target + " & " + $scope.search.disease);

            // get gene specific info 
            cttvAPIservice.getGene( {
                    gene:$scope.search.target
                } ).
                success(function(data, status) {
                    $scope.search.info.gene = data;
                }).
                error(function(data, status) {
                    $log.error(status);
                });


            // get disease specific info with the efo() method
            cttvAPIservice.getEfo( {
                    efo:$scope.search.disease
                } ).
                success(function(data, status) {
                    $scope.search.info.efo = data;
                }).
                error(function(data, status) {
                    $log.error(status);
                });


        }



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
                fd.push({"label":"Genetics", "value":lookDatasource(data, datatypes.GENETIC_ASSOCIATION).score });
                fd.push({"label":"Somatic", "value":lookDatasource(data, datatypes.SOMATIC_MUTATION).score});
                fd.push({"label":"Drugs", "value":lookDatasource(data, datatypes.KNOWN_DRUG).score});
                fd.push({"label":"RNA", "value":lookDatasource(data, datatypes.RNA_EXPRESSION).score});
                fd.push({"label":"Pathways", "value":lookDatasource(data, datatypes.AFFECTED_PATHWAY).score});
                fd.push({"label":"Mouse data", "value":lookDatasource(data, datatypes.ANIMAL_MODEL).score});
                //fd.push({"label":"Genetics", "value":lookDatasource(data, datatypes.GENETIC_ASSOCIATION).score });
            return fd;
        }



        $scope.getFlowerData = function(){
            console.log("getFlowerData()");

            return cttvAPIservice.getAssociation({
                    gene:$scope.search.target, 
                    efo:$scope.search.disease
                }).
                success(function(data, status) {              
                    $scope.search.flower_data = processFlowerData(data.data[0].datatypes);
                    for(var i=0; i<data.data[0].datatypes.length; i++){
                        $scope.search.association_scores[data.data[0].datatypes[i].datatype] = data.data[0].datatypes[i].association_score; 
                    }
                    
                }).
                error(function(data, status) {
                    $log.error(status);
                });            
        }



        // =================================================
        //  G E N E T I C   A S S O C I A T I O N S
        // =================================================



        /*
        Here we need to pull data for two tables via two separte, distinct calls to the API
         - common disease table
         - related rare disease
        */


        // -------------------------------------------------



        var getCommonDiseaseData = function(){
            return cttvAPIservice.getAssociations( {
                    gene:$scope.search.target, 
                    efo:$scope.search.disease,
                    size: 1000,
                    datasource: dbs.GWAS,
                    fields: [
                        "biological_object.efo_info", // disease
                        "evidence.evidence_chain",
                        "evidence.evidence_codes_info"
                        //"evidence.evidence_chain[0].biological_object.about",       // SNP
                        //"evidence.evidence_chain[0].evidence.evidence_codes[1]",    // variant type
                        //"evidence.evidence_chain[0].evidence.evidence_codes[0]",    // evidence source
                        //"evidence.evidence_chain[1].evidence.evidence_codes",       // evidence source
                        //"evidence.evidence_chain[1].evidence.association_score.pvalue.value",   // p-value
                        //"evidence.evidence_chain[1].evidence.provenance_type.literature.pubmed_refs" // publications
                    ]
                } ).
                success(function(data, status) {
                    $scope.search.genetic_associations.common_diseases.data = data.data;
                    initCommonDiseasesTable();
                    $scope.search.genetic_associations.common_diseases.is_open = data.data.length>0;
                    $scope.search.genetic_associations.common_diseases.is_loading = false;

                    // update for parent
                    updateGeneticAssociationsSetting();
                }).
                error(function(data, status) {
                    $log.error(status);
                    $scope.search.genetic_associations.common_diseases.is_open = data.data.length>0;
                    $scope.search.genetic_associations.common_diseases.is_loading = false;

                    // update for parent
                    updateGeneticAssociationsSetting();
                });
        }



        var updateGeneticAssociationsSetting = function(){
            $scope.search.genetic_associations.is_open = $scope.search.genetic_associations.common_diseases.is_open || $scope.search.genetic_associations.rare_diseases.is_open;
            $scope.search.genetic_associations.is_loading = $scope.search.genetic_associations.common_diseases.is_loading || $scope.search.genetic_associations.rare_diseases.is_loading;
        }



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
        }



        /*
         * 
         */
        var formatCommonDiseaseDataToArray = function(data){
            var newdata = [];
            for(var i=0; i<data.length; i++){
                // create rows:
                var row = [];
                
                try{

                    // disease
                    row.push(data[i].biological_object.efo_info[0][0].label);

                    // SNP
                    row.push( "<a href='"+data[i].evidence.evidence_chain[0].biological_object.about[0]+"' target='_blank'>"
                            + data[i].evidence.evidence_chain[0].biological_object.about[0].split('/').pop()
                            + " <i class='fa fa-external-link'></i></a>");

                    // variant type
                    row.push( getEcoLabel( data[i].evidence.evidence_codes_info, data[i].evidence.evidence_chain[0].evidence.evidence_codes[0]) );
                    
                    // evidence source
                    row.push( getEcoLabel( data[i].evidence.evidence_codes_info, data[i].evidence.evidence_chain[0].evidence.evidence_codes[1]) );

                    // evidence source
                    row.push(data[i].evidence.evidence_chain[1].evidence.evidence_codes[0]);

                    // p-value
                    row.push(data[i].evidence.evidence_chain[1].evidence.association_score.pvalue.value);

                    // publications
                    var pub="";
                    if(data[i].evidence.evidence_chain[1].evidence.provenance_type.literature.pubmed_refs){
                        for(var j=0; j<data[i].evidence.evidence_chain[1].evidence.provenance_type.literature.pubmed_refs.length; j++){
                            var n=data[i].evidence.evidence_chain[1].evidence.provenance_type.literature.pubmed_refs[j].split('/').pop();
                            pub+="<a href='http://www.ncbi.nlm.nih.gov/pubmed/"+n+"' target='_blank'>"+n+" <i class='fa fa-external-link'></i></a>"
                        }
                    }
                    row.push(pub);

                    newdata.push(row);
                }catch(e){
                    $log.error("Error parsing common disease data:");
                    $log.error(e);
                }
            }

            return newdata;
        }



        var initCommonDiseasesTable = function(){

            $('#common-diseases-table').dataTable( {
                "data": formatCommonDiseaseDataToArray($scope.search.genetic_associations.common_diseases.data),
                //"ordering" : true,
                //"order": [[3, 'des']],
                "autoWidth": false,
                "paging" : true
            } ); 
        }



        // -------------------------------------------------



        var getRareDiseaseData = function(){
            return cttvAPIservice.getAssociations( {
                    gene:$scope.search.target, 
                    efo:$scope.search.disease,
                    size: 1100,
                    datasource: [dbs.UNIPROT, dbs.EVA ],
                    fields: [
                        "biological_object.efo_info", // disease
                        //"[0].evidence.urls.linkouts", "evidence.evidence_chain[0].biological_object.about", // mutation
                        "evidence.evidence_chain", //
                        //"evidence.evidence_chain[0].evidence.evidence_codes",    // mutation type
                        "evidence.evidence_codes_info",
                        "evidence.evidence_codes",
                        //"evidence.evidence_chain[0].evidence.experiment_specific",    // mutation consequence
                        "evidence.provenance_type.database", "biological_subject.about",    // evidence source
                        "evidence.provenance_type.literature.pubmed_refs",                   // publications
                        "evidence.experiment_specific",
                        "evidence.urls"

                    ]
                } ).
                success(function(data, status) {
                    $scope.search.genetic_associations.rare_diseases.data = data.data;
                    initRareDiseasesTable();
                    $scope.search.genetic_associations.rare_diseases.is_open = data.data.length>0;
                    $scope.search.genetic_associations.rare_diseases.is_loading = false;

                    // update for parent
                    updateGeneticAssociationsSetting();
                }).
                error(function(data, status) {
                    $log.error(status);
                    $scope.search.genetic_associations.rare_diseases.is_open = data.data.length>0;
                    $scope.search.genetic_associations.rare_diseases.is_loading = false;

                    // update for parent
                    updateGeneticAssociationsSetting();
                });
        }



        var formatRareDiseaseDataToArray = function(data){
            var newdata = [];
            for(var i=0; i<data.length; i++){
                // create rows:
                var row = [];
                
                try{

                    var db = data[i].evidence.provenance_type.database.id.toLowerCase();


                    // disease
                    row.push(data[i].biological_object.efo_info[0][0].label);



                    // mutation

                    var mut = messages.NA;
                    //if(data[i].evidence.evidence_chain && data[i].evidence.evidence_chain[0].biological_object.about.length>0){
                    //    mut = "<a href='"+ data[i].evidence.evidence_chain[0].biological_object.about[0] +"' target='_blank'>"
                    //         + data[i].evidence.evidence_chain[0].biological_object.about[0].split('/').pop()
                    //         + " <i class='fa fa-external-link'></i></a>";
                    //} else {
                    //    mut = messages.NA;
                    //}
                    var li = db===dbs.EVA.toLowerCase() ? 0 : 1; //data[i].evidence.urls.linkouts.length-1;
                    if( checkPath(data[i], "evidence.urls.linkouts") ){
                        if( db===dbs.UNIPROT.toLowerCase() ){
                            if( data[i].evidence.urls.linkouts[li]===undefined){
                                li = 0;
                            }
                        }
                        if( data[i].evidence.urls.linkouts[li] ){

                            var url = ((li==0) ? data[i].evidence.urls.linkouts[0].url : ("http://www.uniprot.org/uniprot/"+data[i].evidence.urls.linkouts[0].url.split("/").pop()+"#pathology_and_biotech"));
                            mut = "<a href='" + url + "' target='_blank'>"
                                + data[i].evidence.urls.linkouts[li].nice_name.split("/").pop()
                                + " <i class='fa fa-external-link'></i></a>";
                        }
                    }
                    row.push(mut);



                    // mutation type
                    // for EVA:
                    //  none available at the moment
                    // for uniprot:
                    var eco = messages.NA;
                    if( db===dbs.UNIPROT.toLowerCase() ){
                        if (checkPath(data[i], "evidence.evidence_codes") && data[i].evidence.evidence_codes[1]) {
                            eco = data[i].evidence.evidence_codes[1];
                        }
                    }
                    row.push( getEcoLabel( data[i].evidence.evidence_codes_info, eco ) );


                    // mutation consequence:
                    //  EVA: n/a
                    //  uniprot: evidence.evidence_chain[0].evidence.evidence_codes[1] -> take the label (e.g. "missense variant" or null if no evidence chain)
                    var cons = messages.NA;
                    if( db===dbs.UNIPROT.toLowerCase() ){
                        // if Uniprot
                        if( checkPath(data[i], "evidence.evidence_chain") && data[i].evidence.evidence_chain.length>0){
                            // if( checkPath(data[i].evidence.evidence_chain[0], "evidence.evidence_codes") && data[i].evidence.evidence_chain[0].evidence.evidence_codes.length>=1 ){
                            //     cons = data[i].evidence.evidence_chain[0].evidence.evidence_codes[1].label;
                            // }
                            if(data[i].evidence.evidence_chain[0] && checkPath( data[i].evidence.evidence_chain[0], "evidence.experiment_specific.functional_consequence") ){
                                cons = data[i].evidence.evidence_chain[0].evidence.experiment_specific.functional_consequence;
                            }
                        }
                    }
                    row.push( cons );
                    

                    // evidence source
                    // hardcoded label; the URL comes from :
                    // evidence.provenance_type.database.dbxref.url -- this has got errors!
                    // evidence.linkouts[0].url (identifiers.org -> redirect to ncbi page)
                    var eso = messages.NA;
                    if( db===dbs.EVA.toLowerCase() ){
                        eso = "Curated in EVA";
                        eso = "<a href='"+data[i].evidence.urls.linkouts[0].url+"' target='_blank'>" 
                            + eso 
                            + " <i class='fa fa-external-link'></i></a>";
                    } else if ( db===dbs.UNIPROT.toLowerCase()){
                        eso = "Curated in Uniprot";
                        eso = "<a href='http://www.uniprot.org/uniprot/"+data[i].evidence.urls.linkouts[0].url.split("/").pop()+"#pathology_and_biotech' target='_blank'>" 
                            + eso 
                            + " <i class='fa fa-external-link'></i></a>";
                    }
                    row.push( eso );


                    // publications : evidence.provenance_type.literature.pubmed_refs
                    var pub=messages.NA;
                    if( checkPath(data[i], "evidence.provenance_type.literature.pubmed_refs") ){
                        pub="";
                        for(var j=0; j<data[i].evidence.provenance_type.literature.pubmed_refs.length; j++){
                            var n=data[i].evidence.provenance_type.literature.pubmed_refs[j].split('/').pop();
                            pub+="<a href='http://www.ncbi.nlm.nih.gov/pubmed/"+n+"' target='_blank'>"+n+" <i class='fa fa-external-link'></i></a>, "
                        }
                    }
                    row.push(pub);


                    // add the row to data
                    newdata.push(row);


                }catch(e){
                    console.log("Error parsing rare disease data:");
                    console.log(e);
                }
            }

            return newdata;
        }



        var initRareDiseasesTable = function(){

            $('#rare-diseases-table').dataTable( {
                "data": formatRareDiseaseDataToArray($scope.search.genetic_associations.rare_diseases.data),
                "autoWidth": false,
                "paging" : true
            } ); 
        }



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

        $scope.getDrugData = function(){
            return cttvAPIservice.getAssociations( {
                    gene:$scope.search.target, 
                    efo:$scope.search.disease,
                    size: 1000,
                    datasource: dbs.CHEMBL,
                    fields: [
                        // 0: disease
                        "biological_object.efo_info",

                        // 1: drug 
                        "evidence.evidence_chain", //[0].evidence.experiment_specific.molecule_name 
                        
                        // 2: phase
                        //"evidence.evidence_chain", //[0].evidence.experiment_specific. ???????????????????????
                        
                        // 3: type
                        //"evidence.evidence_chain", //[0].evidence.experiment_specific.molecule_type
                        
                        // 4: Mechanism of action
                        //"evidence.evidence_chain", //[0].evidence.experiment_specific.mechanism_of_action

                        // 5: Activity
                        "biological_subject.properties", //.activity

                        // 6: Clinical trials
                        // ?????????????????????????????????

                        // 7: target name
                        "biological_subject.properties", //.target_name + linkouts[1]
                        "evidence.urls",

                        // 8: target class
                        //"evidence.evidence_chain", //[0].evidence.experiment_specific.target_class[0]
                        
                        // 9: target context
                        "biological_subject.properties", //.target_type

                        // 10: protein complex members
                        "biological_subject.gene_info", //.symbol [] 

                        // 11: evidence type
                        "evidence.evidence_codes_info"    // Evidence codes???

                        /*
                        "biological_subject.properties.target_type",    // Target context
                        "biological_subject.about", //gene_info",    // Protein complex members 
                        
                        "biological_subject.properties.activity",    // Mechanism of action of drug 
                        "evidence.evidence_chain[0].evidence.provenance_type.literature",    // Mechanism of action references
                        "evidence.evidence_chain[0].evidence.evidence_codes",    // Evidence codes: target to drug  
                        "evidence.urls.linkouts",    // Provenance - target
                        //"evidence.urls.linkouts",    // Provenance - drug
                        "evidence.evidence_chain[1].evidence.experiment_specific"    //Evidence codes
                        */
                    ]
                } ).
                success(function(data, status) {
                    $scope.search.drugs.data = data.data;
                    initTableDrugs();
                    $scope.search.drugs.is_open = data.data.length>0;
                    $scope.search.drugs.is_loading = false;
                }).
                error(function(data, status) {
                    $scope.search.drugs.is_open = false;
                    $scope.search.drugs.is_loading = false;
                    $log.error(status);
                });
        }



        var formatDrugsDataToArray = function(data){
            var newdata = [];
            for(var i=0; i<data.length; i++){
                // create rows:
                var row = [];

                try{

                    // 0: disease
                    row.push(data[i].biological_object.efo_info[0][0].label);

                    // 1: drug
                    row.push( "<a href='"+data[i].evidence.urls.linkouts[0].url+"' target='_blank'>"
                                + data[i].evidence.evidence_chain[0].evidence.experiment_specific.molecule_name
                                + " <i class='fa fa-external-link'></i></a>");

                    // 2: phase
                    row.push("Marketed drug");

                    // 3: type
                    row.push(data[i].evidence.evidence_chain[0].evidence.experiment_specific.molecule_type);

                    // 4: Mechanism of action
                    var pubs = 0;
                    var action = data[i].evidence.evidence_chain[0].evidence.experiment_specific.mechanism_of_action+"<br />";
                        action += "<span><span class='badge'>"
                                if(data[i].evidence.evidence_chain[0].evidence.provenance_type 
                                    && data[i].evidence.evidence_chain[0].evidence.provenance_type.literature
                                    && data[i].evidence.evidence_chain[0].evidence.provenance_type.literature.pubmed_refs){
                                        pubs = data[i].evidence.evidence_chain[0].evidence.provenance_type.literature.pubmed_refs.length;
                                } else {
                                    pubs = 0;
                                }
                        action += pubs+"</span> publications</span>";

                        // publications:
                        // we show the publications here in the cells for now
                        // eventually this should be in a popup or tooltip of some sort
                        var pub="";
                        if( pubs>0 ){
                            pub=":<div>";
                            for(var j=0; j<pubs; j++){
                                var n=data[i].evidence.evidence_chain[0].evidence.provenance_type.literature.pubmed_refs[j].split('/').pop();
                                pub+="<a href='http://www.ncbi.nlm.nih.gov/pubmed/"+n+"' target='_blank'>"+n+" <i class='fa fa-external-link'></i></a> "
                            }
                            pub+="</div>";
                        }
                        action+=pub;

                        //action += "<div class='dropdown-menu' style='display:block; position:relative;'>Hello</div>";
                                
                    row.push(action);

                    //evidence.provenance type.

                    // 5: Activity
                    row.push(data[i].biological_subject.properties.activity);

                    // 6: Clinical trials
                    row.push( "<a href='https://clinicaltrials.gov/search?intr=%22"
                                + data[i].evidence.evidence_chain[0].evidence.experiment_specific.molecule_name
                                + "%22' target='_blank'>View in clinicaltrials.org <i class='fa fa-external-link'></i></a>");

                    // 7: target name
                    row.push("<a href='"+data[i].evidence.urls.linkouts[1].url+"' target='_blank'>"+data[i].biological_subject.properties.target_name+" <i class='fa fa-external-link'></i></a>"); // + linkouts[1]

                    // 8: target class
                    row.push(data[i].evidence.evidence_chain[0].evidence.experiment_specific.target_class[0]);

                    // 9: target context
                    row.push(data[i].biological_subject.properties.target_type);

                    // 10: protein complex members
                    var prot="";
                    if(data[i].biological_subject.gene_info){
                        for(var j=0; j<data[i].biological_subject.gene_info.length; j++){
                            prot+="<a href='#/target-associations?q="+data[i].biological_subject.gene_info[j].geneid
                                +"' title='"+data[i].biological_subject.gene_info[j].name+"'>"
                                +data[i].biological_subject.gene_info[j].symbol
                                +"</a>, "
                        }
                    }
                    row.push(prot);

                    // 11: evidence source
                    //row.push(data[i].evidence.evidence_chain[1].evidence.experiment_specific);    // Evidence codes
                    row.push(data[i].evidence.evidence_codes_info[0][0].label);    // Evidence codes


                    newdata.push(row); // use push() so we don't end up with empty rows
                }catch(e){
                    console.log("Error parsing drugs data:");
                    console.log(e);
                }
            }
            return newdata;
        }



        /*
         * This is the hardcoded data for the Known Drugs table and 
         * will obviously need to change and pull live data when available
         */
        var initTableDrugs = function(){

            $('#drugs-table').dataTable( {
                "data": formatDrugsDataToArray($scope.search.drugs.data),
                "autoWidth": false,
                //"lengthChange": false,
                "paging": true,
                //"bInfo" : false,
                //"ordering": false
            } ); 

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



        $scope.getPathwaysData = function(){
            return cttvAPIservice.getAssociations( {
                    gene:$scope.search.target, 
                    efo:$scope.search.disease,
                    size: 1000,
                    datasource: dbs.REACTOME,
                    fields: [
                        "biological_object.efo_info",
                        "biological_subject.properties.target_type",    //Target context
                        "biological_subject.gene_info",    //Protein complex members 
                        "biological_subject.properties.activity",    //Activity 
                        "evidence.properties.experiment_specific.additional_properties",    //Additional context
                        "evidence.urls.linkouts",    //Provenance - SourceDB  
                        "evidence.provenance_type.literature", //.pubmed_refs",    //Provenance - References 
                        "evidence.date_asserted",    //Date asserted 
                        "evidence.evidence_codes"    //Evidence codes
                    ]
                } ).
                success(function(data, status) {
                    $scope.search.pathways.data = data.data;
                    initTablePathways();
                    $scope.search.pathways.is_open = data.data.length>0;
                    $scope.search.pathways.is_loading = false;
                }).
                error(function(data, status) {
                    $log.error(status);
                    $scope.search.pathways.is_open = false;
                    $scope.search.pathways.is_loading = false;
                });
        }



        /*
         *
         */
        var formatPathwaysDataToArray = function(data){
            var newdata = [];
            for(var i=0; i<data.length; i++){
                // create rows:
                var row = [];  
                
                try{
                    // old working version
                    /*
                    // target context
                    row.push(data[i].biological_subject.properties.target_type);

                    // protein complex member
                    var prot="";
                    if(data[i].biological_subject.gene_info){
                        for(var j=0; j<data[i].biological_subject.gene_info.length; j++){
                            prot+="<a href='#/target-associations?q="+data[i].biological_subject.gene_info[j].geneid
                                +"' title='"+data[i].biological_subject.gene_info[j].name+"'>"
                                +data[i].biological_subject.gene_info[j].symbol
                                +"</a>, "
                        }
                    }
                    row.push(prot);

                    // activity
                    row.push(data[i].biological_subject.properties.activity);
                    // additional context
                    var prop = "";
                        for(var p in data[i].evidence.properties.experiment_specific.additional_properties){
                            prop += p + ":&nbsp;" + data[i].evidence.properties.experiment_specific.additional_properties[p] + ", "
                        }
                    row.push(prop);
                    // provenance - source
                    row.push("<a href='" + data[i].evidence.urls.linkouts[0].url+"' target='_blank'>" + data[i].evidence.urls.linkouts[0].nice_name + " <i class='fa fa-external-link'></i></a>");
                    // provenance - references
                    row.push(data[i].evidence.provenance_type.literature.pubmed_refs || ""); 
                    // date asserted
                    row.push(data[i].evidence.date_asserted);
                    // evidence codes
                    row.push(data[i].evidence.evidence_codes.join(", "));

                    newdata.push(row); // use push() so we don't end up with empty rows
                    */

                    // disease
                    row.push(data[i].biological_object.efo_info[0][0].label);

                    // pathway
                    row.push("Available soon");

                    // overview
                    row.push("<a href='" + data[i].evidence.urls.linkouts[0].url+"' target='_blank'>" + data[i].evidence.urls.linkouts[0].nice_name + " <i class='fa fa-external-link'></i></a>");

                    // activity
                    row.push(data[i].biological_subject.properties.activity);

                    // target context
                    row.push(data[i].biological_subject.properties.target_type);

                    // protein complex member
                    var prot="";
                    if(data[i].biological_subject.gene_info){
                        for(var j=0; j<data[i].biological_subject.gene_info.length; j++){
                            prot+="<a href='#/target-associations?q="+data[i].biological_subject.gene_info[j].geneid
                                +"' title='"+data[i].biological_subject.gene_info[j].name+"'>"
                                +data[i].biological_subject.gene_info[j].symbol
                                +"</a>, "
                        }
                    }
                    row.push(prot);

                    // mutations
                    var prop = messages.NA;
                        if( checkPath(data[i], "evidence.properties.experiment_specific.additional_properties") ){
                            prop="";
                            for(var p in data[i].evidence.properties.experiment_specific.additional_properties){
                                prop += p + ":&nbsp;" + data[i].evidence.properties.experiment_specific.additional_properties[p] + ", "
                            }
                        }
                        
                    row.push(prop);

                    // evidence codes
                    row.push("Curated in Reactome<br />" + data[i].evidence.evidence_codes.join(", "));

                    // publications
                    var pub=messages.NA;
                    if( checkPath(data[i], "evidence.provenance_type.literature.pubmed_refs") ){
                        pub="";
                        for(var j=0; j<data[i].evidence.provenance_type.literature.pubmed_refs.length; j++){
                            var n=data[i].evidence.provenance_type.literature.pubmed_refs[j].split('/').pop();
                            pub+="<a href='http://www.ncbi.nlm.nih.gov/pubmed/"+n+"' target='_blank'>"+n+" <i class='fa fa-external-link'></i></a>"
                        }
                    }
                    row.push(pub);



                    newdata.push(row); // use push() so we don't end up with empty rows

                }catch(e){
                    $log.error("Error parsing pathways data:");
                    $log.error(e);
                }
            }
            return newdata;
        }



        var initTablePathways = function(){
            $('#pathways-table').dataTable( {
                //"data": [[1,2,3,4,5,6,7]],
                "data" : formatPathwaysDataToArray($scope.search.pathways.data),
                /*"columns": [
                    { "title": "Target context" },
                    { "title": "Protein complex members" },
                    { "title": "Activity" },
                    { "title": "Additional context" },
                    { "title": "Provenance (SourceDB)" },
                    { "title": "Provenance (References)" },
                    { "title": "Date asserted" },
                    { "title": "Evidence codes" }
                ],*/
                //"ordering" : true,
                "autoWidth": false,
                "paging" : true
            } ); 
        }



        // =================================================
        //  RNA expression
        // =================================================



        $scope.getRnaExpressionData = function(){
            return cttvAPIservice.getAssociations( {
                    gene:$scope.search.target, 
                    efo:$scope.search.disease,
                    size: 1000,
                    datasource: 'expression_atlas',
                    fields: [
                        "biological_object.efo_info",
                        "biological_object.properties.biosamples",
                        "evidence.experiment_specific",
                        //"evidence.experiment_specific.comparison_name", // comparison
                        "biological_subject.properties.activity",  // activity
                        //"evidence.experiment_specific.log2_fold_change", // fold change
                        "evidence.association_score.pvalue.value", // p-value
                        "evidence.urls.linkouts", // provenance & experiment overview
                        //"evidence.experiment_specific.literature.pubmed_refs",  // literature
                        "evidence.evidence_codes",
                        "evidence.evidence_codes_info"
                    ]
                } ).
                success(function(data, status) {
                    $scope.search.rna_expression.data = data.data;
                    initTableRNA();
                    $scope.search.rna_expression.is_open = data.data.length>0;
                    $scope.search.rna_expression.is_loading = false;
                }).
                error(function(data, status) {
                    $log.error(status);
                    $scope.search.rna_expression.is_open = false;
                    $scope.search.rna_expression.is_loading = false;
                });
        }



        /*
         * Takes the data object returned by the API and formats it to an array of arrays 
         * to be displayed by the RNA-expression dataTable widget.
         */
        var formatRnaDataToArray = function(data){
            var newdata = [];
            for(var i=0; i<data.length; i++){
                // create rows:
                var row = [];
                
                try{
                    // original working version
                    /*
                    // comparison
                    row.push(data[i].evidence.experiment_specific.comparison_name);
                    // activity
                    row.push(data[i].biological_subject.properties.activity); //.split("/").pop().split("_").join(" "));
                    // fold change
                    row.push(data[i].evidence.experiment_specific.log2_fold_change);
                    // p-value
                    row.push(data[i].evidence.association_score.pvalue.value);
                    // provenance
                    //row.push(data[i].evidence.urls.linkouts.reduce(function(p,c,a,i){return p.nice_name+", "+c.nice_name}));
                    row.push("<a href='"+data[i].evidence.urls.linkouts[2].url+"' target='_blank'>Gene expression details <i class='fa fa-external-link'></i></a>");
                    // experiment overview
                    row.push("<a href='"+data[i].evidence.urls.linkouts[0].url+"' target='_blank'>Experiment overview and raw data <i class='fa fa-external-link'></i></a>");
                    // publications
                    var pub="";
                    if(data[i].evidence.experiment_specific.literature.pubmed_refs){
                        for(var j=0; j<data[i].evidence.experiment_specific.literature.pubmed_refs.length; j++){
                            var n=data[i].evidence.experiment_specific.literature.pubmed_refs[j].split('/').pop();
                            pub+="<a href='http://www.ncbi.nlm.nih.gov/pubmed/"+n+"' target='_blank'>"+n+" <i class='fa fa-external-link'></i></a>"
                        }
                    }
                    row.push(pub);
                    newdata.push(row); // push, so we don't end up with empty rows
                    */

                    // disease
                    row.push(data[i].biological_object.efo_info[0][0].label);

                    // comparison
                    row.push(data[i].evidence.experiment_specific.comparison_name);

                    // activity
                    row.push( "<a href='"+data[i].evidence.urls.linkouts[2].url+"' target='_blank'>"+data[i].biological_subject.properties.activity+"<i class='fa fa-external-link'></i></a>" );

                    // tissue
                    row.push( checkPath(data[i], "biological_object.properties.biosamples") ? data[i].biological_object.properties.biosamples : messages.NA );

                    // evidence source
                    //row.push("");
                    row.push( getEcoLabel( data[i].evidence.evidence_codes_info, data[i].evidence.evidence_codes[0]) + " <a href='http://www.ebi.ac.uk/gxa/FAQ.html' target='_blank'>[?]</a>" );

                    // fold change
                    row.push(data[i].evidence.experiment_specific.log2_fold_change);

                    // p-value
                    row.push(data[i].evidence.association_score.pvalue.value);

                    // experiment overview
                    row.push("<a href='"+data[i].evidence.urls.linkouts[0].url+"' target='_blank'>" + (data[i].evidence.experiment_specific.study_title || "Experiment overview and raw data") + " <i class='fa fa-external-link'></i></a>");

                    // publications
                    var pub="";
                    if(data[i].evidence.experiment_specific.literature.pubmed_refs){
                        for(var j=0; j<data[i].evidence.experiment_specific.literature.pubmed_refs.length; j++){
                            var n=data[i].evidence.experiment_specific.literature.pubmed_refs[j].split('/').pop();
                            pub+="<a href='http://www.ncbi.nlm.nih.gov/pubmed/"+n+"' target='_blank'>"+n+" <i class='fa fa-external-link'></i></a>"
                        }
                    }
                    row.push(pub);

                    newdata.push(row); // push, so we don't end up with empty rows

                }catch(e){
                    console.log("Error parsing RNA-expression data:");
                    console.log(e);
                }
            }

            return newdata;
        }



        var initTableRNA = function(){

            $('#rna-expression-table').dataTable( {
                "data": formatRnaDataToArray($scope.search.rna_expression.data),
                "autoWidth": false,
                "paging" : true
            } ); 
        }



        // =================================================
        //  S O M A T I C   M U T A T I O N S
        // =================================================



        var getMutationData = function(){
            return cttvAPIservice.getAssociations( {
                    gene:$scope.search.target, 
                    efo:$scope.search.disease,
                    size: 1000,
                    datasource: dbs.CANCER_GENE_CENSUS,
                    fields: [
                        "biological_object.efo_info", // disease
                        "evidence.evidence_codes_info",  // evidence source
                        "evidence.urls"
                    ]
                } ).
                success(function(data, status) {
                    $scope.search.somatic_mutations.data = data.data;
                    initTableMutations();
                    $scope.search.somatic_mutations.is_open = data.data.length>0;
                    $scope.search.somatic_mutations.is_loading = false;
                }).
                error(function(data, status) {
                    $scope.search.somatic_mutations.is_open = data.data.length>0;
                    $scope.search.somatic_mutations.is_loading = false;
                    $log.error(status);
                });
        }



        /*
         * 
         */
        var formatMutationsDataToArray = function(data){
            var newdata = [];
            for(var i=0; i<data.length; i++){
                // create rows:
                var row = [];
                
                try{
                    // disease
                    row.push(data[i].biological_object.efo_info[0][0].label);
                    // evidence source
                    //row.push(data[i].evidence.evidence_codes_info[0][0].label);
                    row.push( "<a href='"+data[i].evidence.urls.linkouts[0].url+"' target='_blank'>"+data[i].evidence.urls.linkouts[0].nice_name+" <i class='fa fa-external-link'></i></a>" );
                    newdata.push(row); // push, so we don't end up with empty rows
                }catch(e){
                    console.log("Error parsing somatic mutation data:");
                    console.log(e);
                }
            }

            return newdata;
        }



        var initTableMutations = function(){

            $('#mutations-table').dataTable( {
                "data": formatMutationsDataToArray($scope.search.somatic_mutations.data),
                //"ordering" : true,
                //"order": [[3, 'des']],
                "autoWidth": false,
                "paging" : true
            } ); 
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
            return cttvAPIservice.getAssociations( {
                    gene:$scope.search.target, 
                    efo:$scope.search.disease,
                    size: 1000,
                    datasource: dbs.PHENODIGM,
                    fields: [
                        "biological_object.efo_info", // disease
                        "biological_object.properties.experiment_specific",
                        //"evidence.properties.evidence_chain",
                        "evidence.evidence_chain",
                        "unique_association_fields",
                        "evidence.association_score"
                    ]
                } ).
                success(function(data, status) {
                    $scope.search.mouse.data = data.data;
                    initTableMouse();
                    $scope.search.mouse.is_open = data.data.length>0;
                    $scope.search.mouse.is_loading = false;
                }).
                error(function(data, status) {
                    $log.error(status);
                    $scope.search.mouse.is_open = false;
                    $scope.search.mouse.is_loading = false;
                });
        }



        /*
         * 
         */
        var formatMouseDataToArray = function(data){
            var newdata = [];
            for(var i=0; i<data.length; i++){
                // create rows:
                var row = [];
                
                try{
                    // disease
                    row.push(data[i].biological_object.efo_info[0][0].label);

                    // human
                    var human = "";
                    var exp = data[i].evidence.evidence_chain[2].biological_object.properties.experiment_specific
                    for(var e in exp){
                        human += "<li>" + exp[e] + "</li>";
                    }
                    human = "<ul>" + human + "</ul>" ;//human.substr(0, human.length-6);
                    row.push(human);

                    // mouse
                    var mouse = "";
                    exp = data[i].evidence.evidence_chain[2].biological_subject.properties.experiment_specific
                    for(var e in exp){
                        mouse += "<li>" + exp[e] + "</li>";
                    }
                    mouse = "<ul>" + mouse + "</ul>" ;//mouse.substr(0, mouse.length-2);
                    row.push(mouse);

                    // mouse model
                    var mousemodel = processMouseModelLinks( data[i].unique_association_fields.allelic_composition, data[i].unique_association_fields.allele_ids)
                                    + "<br/ >"
                                    + "<span class='small text-lowlight'>"+data[i].unique_association_fields.genetic_background+"</span>"
                    row.push(mousemodel);

                    // evidence source
                    row.push("Phenodigm"); //data[i].unique_association_fields.predictionModel);

                    // score
                    row.push(data[i].evidence.association_score.probability.value);


                    newdata.push(row); // push, so we don't end up with empty rows
                }catch(e){
                    $log.error("Error parsing mouse data:");
                    $log.error(e);
                }
            }

            return newdata;
        }



        var initTableMouse = function(){

            $('#mouse-table').dataTable( {
                "data": formatMouseDataToArray($scope.search.mouse.data),
                "autoWidth": false,
                "paging" : true,
                "ordering" : true,
                "order": [[5, 'asc']],
            } ); 
        }



        /*
         * Takes a string like "Casr<Nuf>/Casr<+>" and returns "Casr<sup>Nuf</sup>/Casr<sup>+</sup>"
         */
        var processMouseModelData = function(mmd){
            return mmd.replace(/<(.*?)>/g, function(match){return "<sup>"+match.substr(1,match.length-2)+"</sup>"});
        }


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



        if($location.search().t && $location.search().d){
            // parse parameters
            $scope.search.target = $location.search().t;
            $scope.search.disease = $location.search().d;

            /*
            $scope.$watch("search.info.data", function(newValue, oldValue) {
                if($scope.search.info.data.biological_object){
                    if($scope.search.info.data.biological_object.efo_info[0][0].path){
                        $scope.search.info.efo_path = $scope.search.info.data.biological_object.efo_info[0][0].path;
                    }
                }
            });
            */


            // will need a way of parsing filters too...
            // $scope.parseFilters() ...

            // and fire the info search
            $scope.getInfo();

            // get the data for the flower graph
            $scope.getFlowerData();

            // then try get some data
            getCommonDiseaseData();
            getRareDiseaseData();
            
            getMutationData(); 
            $scope.getDrugData();
            $scope.getRnaExpressionData();
            $scope.getPathwaysData();
            getMouseData();

        }

    }]);
