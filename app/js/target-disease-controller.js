
    /* Controllers */

    angular.module('cttvControllers')

    /**
     * GeneDiseaseCtrl
     * Controller for the Gene <-> Disease page
     * It loads the evidence for the given target <-> disease pair
     */
    .controller('TargetDiseaseCtrl', ['$scope', '$location', '$log', 'cttvAPIservice', 'cttvUtils', 'cttvDictionary', 'cttvConsts', 'cttvConfig', 'clearUnderscoresFilter', 'upperCaseFirstFilter', '$uibModal', '$compile', '$http', '$q', '$timeout', '$analytics', 'cttvLocationState', '$anchorScroll', '$rootScope', function ($scope, $location, $log, cttvAPIservice, cttvUtils, cttvDictionary, cttvConsts, cttvConfig, clearUnderscores, upperCaseFirst, $uibModal, $compile, $http, $q, $timeout, $analytics, cttvLocationState, $anchorScroll, $rootScope) {
        'use strict';
        // $log.log('TargetDiseaseCtrl()');

		cttvLocationState.init();   // does nothing, but ensures the cttvLocationState service is instantiated and ready
        cttvUtils.clearErrors();

        var checkPath = cttvUtils.checkPath;

        var searchObj = cttvUtils.search.translateKeys($location.search());

        // var dbs = cttvConsts.dbs;
        var datatypes = cttvConsts.datatypes;

        //
        var accessLevelPrivate = "<span class='cttv-access-private' title='private data'></span>"; //"<span class='fa fa-users' title='private data'>G</span>";
        var accessLevelPublic = "<span class='cttv-access-public' title='public data'></span>"; //"<span class='fa fa-users' title='public data'>P</span>";

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
            tables : {
                genetic_associations : {
                    is_open : false,
                    is_loading: false,
                    heading : cttvDictionary.GENETIC_ASSOCIATION,
                    common_diseases : {
                        data : [],
                        is_open : false,
                        is_loading: false,
                        heading : cttvDictionary.COMMON_DISEASES,
                        source : cttvConfig.evidence_sources.genetic_association.common,
                        source_label : cttvConfig.evidence_sources.genetic_association.common.map(function(s){return {label:cttvDictionary[ cttvConsts.invert(s) ], url:cttvConsts.dbs_info_url[cttvConsts.invert(s)]}; }),
                        has_errors: false,
                    },
                    rare_diseases : {
                        data : [],
                        is_open : false,
                        is_loading: false,
                        heading : cttvDictionary.RARE_DISEASES,
                        source : cttvConfig.evidence_sources.genetic_association.rare,
                        source_label : cttvConfig.evidence_sources.genetic_association.rare.map(function(s){return {label:cttvDictionary[ cttvConsts.invert(s) ], url:cttvConsts.dbs_info_url[cttvConsts.invert(s)]}; }),
                        has_errors: false,
                    }
                },
                rna_expression : {
                    data : [],
                    is_open : false,
                    is_loading: false,
                    heading : cttvDictionary.RNA_EXPRESSION,
                    source : cttvConfig.evidence_sources.rna_expression,
                    source_label : cttvConfig.evidence_sources.rna_expression.map(function(s){return {label:cttvDictionary[ cttvConsts.invert(s) ], url:cttvConsts.dbs_info_url[cttvConsts.invert(s)]}; }),
                    has_errors: false,
                },
                affected_pathways : {
                    data : [],
                    is_open : false,
                    is_loading: false,
                    heading : cttvDictionary.AFFECTED_PATHWAY,
                    source : cttvConfig.evidence_sources.pathway,
                    source_label : cttvConfig.evidence_sources.pathway.map(function(s){return {label:cttvDictionary[ cttvConsts.invert(s) ], url:cttvConsts.dbs_info_url[cttvConsts.invert(s)]}; }),
                    has_errors: false,
                },
                known_drugs : {
                    data : [],
                    is_open : false,
                    is_loading: false,
                    heading : cttvDictionary.KNOWN_DRUG,
                    source : cttvConfig.evidence_sources.known_drug,
                    source_label : cttvConfig.evidence_sources.known_drug.map(function(s){return {label:cttvDictionary[ cttvConsts.invert(s) ], url:cttvConsts.dbs_info_url[cttvConsts.invert(s)]}; }),
                    has_errors: false,
                },
                somatic_mutations : {
                    data : [],
                    is_open : false,
                    is_loading: false,
                    heading : cttvDictionary.SOMATIC_MUTATION,
                    source : cttvConfig.evidence_sources.somatic_mutation,
                    source_label : cttvConfig.evidence_sources.somatic_mutation.map(function(s){return {label:cttvDictionary[ cttvConsts.invert(s) ], url:cttvConsts.dbs_info_url[cttvConsts.invert(s)]}; }),
                    has_errors: false,
                },
                literature : {
                    data : [],
                    is_open : false,
                    is_loading: false,
                    heading : cttvDictionary.LITERATURE,
                    source : cttvConfig.evidence_sources.literature,
                    source_label : cttvConfig.evidence_sources.literature.map(function(s){return {label:cttvDictionary[ cttvConsts.invert(s) ], url:cttvConsts.dbs_info_url[cttvConsts.invert(s)]}; }),
                    has_errors: false,
                },
                animal_models : {
                    data : [],
                    is_open : false,
                    is_loading: false,
                    heading : cttvDictionary.ANIMAL_MODEL,
                    source : cttvConfig.evidence_sources.animal_model,
                    source_label : cttvConfig.evidence_sources.animal_model.map(function(s){return {label:cttvDictionary[ cttvConsts.invert(s) ], url:cttvConsts.dbs_info_url[cttvConsts.invert(s)]}; }),
                    has_errors: false,
                }
            }
        };

        $scope.datatypes = datatypes;

        var arrayToList = function(arr, oneToString){
            if(oneToString && arr.length==1){
                return arr[0];
            }
            return "<ul><li>" + arr.join("</li><li>") + "</li></ul>";
        };
        // =================================================
        //  I N F O
        // =================================================

        /**
         * Get the information for target and disease,
         * i.e. to fill the two boxes at the top of the page
         */
         var targetPromise;
         var getInfo = function(){
             // get gene specific info
             var queryObject = {
                 method: 'GET',
                 params: {
                     target_id: $scope.search.target
                 }
             };
             targetPromise = cttvAPIservice.getTarget(queryObject)
                .then(function(resp) {
                    $scope.search.info.gene = resp.body;
                    return resp;
                },cttvAPIservice.defaultErrorHandler)
                .then (function (target) {
                    return $http.get("/proxy/www.ebi.ac.uk/pdbe/api/mappings/best_structures/" + target.body.uniprot_id);
                });

             // get disease specific info with the efo() method
             var queryObject = {
                 method: 'GET',
                 params: {
                     code: $scope.search.disease
                 }
             };
             cttvAPIservice.getDisease(queryObject).
             then(
                 function(resp) {
                     $scope.search.info.efo = resp.body;
                     // TODO: This is not returned by the api yet. Maybe we need to remove it later
                     $scope.search.info.efo.efo_code = $scope.search.disease;
                     //updateTitle();
                 },
                 cttvAPIservice.defaultErrorHandler
             );

         };


        var updateTitle = function(t, d){
            $scope.search.info.title = (t+"-"+d).split(" ").join("_");
        };



        // =================================================
        //  F L O W E R
        // =================================================

        /*
         * takes a datasources array and returns an array of objects {value: number, label:string}
         */
        function processFlowerData(data){
            var fd = [];

            for (var i=0; i<cttvConsts.datatypesOrder.length; i++) {
                var dkey = cttvConsts.datatypes[cttvConsts.datatypesOrder[i]];
                var key = cttvConsts.datatypesOrder[i];
                fd.push({
                    // "value": lookDatasource(data, cttvConsts.datatypes[key]).score,
                    "value": data[dkey],
                    "label": cttvConsts.datatypesLabels[key],
                    "active": true,
                });
            }

            return fd;
        }



        var getFlowerData = function(){
            var opts = {
                target:$scope.search.target,
                disease:$scope.search.disease,
                facets: false
            };
            _.extend(opts, searchObj);

            var queryObject = {
                method: 'GET',
                params: opts
            };

            return cttvAPIservice.getAssociations (queryObject)
                .then (function(resp) {
                    $scope.search.flower_data = processFlowerData(resp.body.data[0].association_score.datatypes);
                    updateTitle( resp.body.data[0].target.gene_info.symbol, resp.body.data[0].disease.efo_info.label );
                }, cttvAPIservice.defaultErrorHandler);
        };



        // =================================================
        //  G E N E T I C   A S S O C I A T I O N S
        // =================================================



        /*
        Here we need to pull data for two tables via two separate, distinct calls to the API
         - common disease table
         - related rare disease
        */


        // -------------------------------------------------



        var updateGeneticAssociationsSetting = function(){
            //$scope.search.tables.genetic_associations.is_open = $scope.search.tables.genetic_associations.common_diseases.is_open || $scope.search.tables.genetic_associations.rare_diseases.is_open;
            $scope.search.tables.genetic_associations.is_loading = $scope.search.tables.genetic_associations.common_diseases.is_loading || $scope.search.tables.genetic_associations.rare_diseases.is_loading;
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

        var parseBestStructure = function (structures) {
            var best = {
                pdb_id : structures[0].pdb_id,
                mappings: [structures[0]]
            };
            // Look for the other structures with the same id:
            for (var i=1; i<structures.length; i++) {
                var struct = structures[i];
                if (struct.pdb_id === best.pdb_id) {
                    best.mappings.push(struct);
                }
            }
            return best;
        };

        var variantIsInStructure = function (variant, structure) {
            for (var i=0; i<structure.mappings.length; i++) {
                var mapping = structure.mappings[i];
                if ((~~variant.begin > mapping.unp_start) && (~~variant.end < mapping.unp_end)) {
                    return true;
                }
            }
            return false;
        };

        // var convertUniprotCoords = function (variant, structure) {
        //     for (var i=0; i<structure.mappings.length; i++) {
        //         var mapping = structure.mappings[i];
        //         if ((~~variant.begin > mapping.unp_start) && (~~variant.end < mapping.unp_end)) {
        //             var pdbStart = ~~variant.begin - mapping.unp_start + mapping.start;
        //             var pdbEnd = ~~variant.end - mapping.unp_start + mapping.start;
        //             return {
        //                 mapping : mapping,
        //                 // start: pdbStart,
        //                 // end: pdbEnd,
        //                 // coverage: mapping.coverage,
        //                 // chain_id: mapping.chain_id,
        //                 alternativeAA: variant.alternativeSequence,
        //                 description: variant.description
        //             };
        //         }
        //     }
        //     return {};
        // };

        function mapSnpsInStructure(bestStructures) {
            if (bestStructures) {
                $scope.search.info.bestStructure = parseBestStructure(bestStructures.data[$scope.search.info.gene.uniprot_id]);
            }
            var url = "/proxy/www.ebi.ac.uk/proteins/api/variation/" + $scope.search.info.gene.uniprot_id;
            return $http.get(url)
                .then(function (varsResp) {
                    var snps = varsResp.data.features;
                    var snpsLoc = {};
                    var snpId;
                    for (var i = 0; i < snps.length; i++) {
                        snpId = undefined;

                        var variant = snps[i];
                        if (variant.xrefs) {
                            for (var j = 0; j < variant.xrefs.length; j++) {
                                if (variant.xrefs[j].id.indexOf("rs") === 0) {
                                    snpId = variant.xrefs[j].id;
                                    break;
                                }
                            }
                            if (snpId) {
                                snpsLoc[snpId] = variant;
                            }
                        }
                    }
                    return snpsLoc;
                });
        }

        var getSnpPositions = function () {
            targetPromise = targetPromise
                .then (function (bestStructures) {
                    return mapSnpsInStructure(bestStructures);
                }, function (err) {
                    $log.warn("No protein structure found in PDBe for " + $scope.search.info.gene.approved_symbol);
                    return mapSnpsInStructure();
                });
        };


        var getCommonDiseaseData = function(){
            $scope.search.tables.genetic_associations.common_diseases.is_loading = true;
            var opts = {
                target:$scope.search.target,
                disease:$scope.search.disease,
                size: 1000,
                datasource: cttvConfig.evidence_sources.genetic_association.common,
                fields:[
                    "disease",
                    "evidence",
                    "variant",
                    "target",
                    "sourceID",
                    "access_level"
                ]
            };
            _.extend(opts, searchObj);

            var queryObject = {
                method: 'GET',
                params: opts
            };

            return targetPromise.then (function (snpsLoc) {
                cttvAPIservice.getFilterBy( queryObject )
                .then(
                    function(resp) {
                        if( resp.body.data ){
                            var data = resp.body.data;
                            for (var i=0; i<data.length; i++) {
                                var item = data[i];
                                if (checkPath(item, "variant.id") && item.variant.id[0]) {
                                    var rsId = item.variant.id[0].split('/').pop();
                                    if (snpsLoc && snpsLoc[rsId] && variantIsInStructure(snpsLoc[rsId], $scope.search.info.bestStructure)) {
                                        data[i].variant.pos = snpsLoc[rsId];
                                    }
                                }
                            }
                            $scope.search.tables.genetic_associations.common_diseases.data = data;
                            initCommonDiseasesTable();
                        } else {
                            $log.warn("Empty response : common disease");
                        }
                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    //$scope.search.tables.genetic_associations.common_diseases.is_open = $scope.search.tables.genetic_associations.common_diseases.data.length>0 || false;
                    $scope.search.tables.genetic_associations.common_diseases.is_loading = false;

                    // update for parent
                    updateGeneticAssociationsSetting();
                });
            }, cttvAPIservice.defaultErrorHandler);
        };


        /*
         *
         */
        var formatCommonDiseaseDataToArray = function(data){
            var newdata = [];

            data.forEach(function(item){

                // create rows:
                var row = [];

                try{

                    // data origin: public / private
                    row.push( (item.access_level==cttvConsts.ACCESS_LEVEL_PUBLIC) ? accessLevelPublic : accessLevelPrivate );

                    // disease name
                    row.push( item.disease.efo_info.label );

                    // Variant
                    var mut ="<a class='cttv-external-link' href='http://www.ensembl.org/Homo_sapiens/Variation/Explore?v="+item.variant.id[0].split('/').pop()+"' target='_blank'>"+item.variant.id[0].split('/').pop()+"</a>";
                    row.push(mut);

                    // variant type
                    var t = clearUnderscores( getEcoLabel(item.evidence.evidence_codes_info, item.evidence.gene2variant.functional_consequence.split('/').pop() ) );
                    // row.push( clearUnderscores( getEcoLabel(item.evidence.evidence_codes_info, item.evidence.gene2variant.functional_consequence.split('/').pop() ) ) );
                    if (item.variant && item.variant.pos) {
                        // var msg3d = "<div><p><a class=cttv-change-view onclick='angular.element(this).scope().showVariantInStructure(" + ~~item.variant.pos.begin + ", " + ~~item.variant.pos.end + ", \"" + item.variant.pos.wildType + "\", \"" + item.variant.pos.alternativeSequence + "\")'>View in 3D</p></a></div>";
                        // row.push($compile(mut + msg3d)($scope)[0].innerHTML);
                        var partial = "<span><a onclick='angular.element(this).scope().showVariantInStructure(" + ~~item.variant.pos.begin + ", " + ~~item.variant.pos.end + ", \"" + item.variant.pos.wildType + "\", \"" + item.variant.pos.alternativeSequence + "\")'>View in 3D</a></span>";
                        t += "<br/><div class=cttv-change-view>";
                        t += $compile(partial)($scope)[0].innerHTML;
                        t += "</div>";
                    }
                    row.push(t);

                    // evidence source
                    row.push( cttvDictionary.CTTV_PIPELINE );

                    // evidence source
                    row.push( "<a class='cttv-external-link' href='https://www.ebi.ac.uk/gwas/search?query="+item.variant.id[0].split('/').pop()+"' target='_blank'>"
                            + clearUnderscores(item.sourceID)
                            + "</a>");

                    // p-value
                    row.push( item.evidence.variant2disease.resource_score.value.toPrecision(1) );
                    //row.push( item.evidence.variant2disease.resource_score.value.toExponential(1) );

                    // publications
                    var refs = [];
                    if ( checkPath(item, "evidence.variant2disease.provenance_type.literature.references") ) {
                        refs = item.evidence.variant2disease.provenance_type.literature.references;
                    }

                    var pmidsList = cttvUtils.getPmidsList( refs );
                    row.push( cttvUtils.getPublicationsString( pmidsList ) );

                    // Publication ids (hidden)
                    row.push(pmidsList.join(", "));


                    newdata.push(row);

                }catch(e){
                    $scope.search.tables.genetic_associations.common_diseases.has_errors = true;
                    $log.error("Error parsing common disease data:");
                    $log.error(e);
                }
            });

            return newdata;
        };



        var initCommonDiseasesTable = function(){

            $('#common-diseases-table').DataTable( cttvUtils.setTableToolsParams({
                "data": formatCommonDiseaseDataToArray($scope.search.tables.genetic_associations.common_diseases.data),
                "ordering" : true,
                "order": [[1, 'asc']],
                "autoWidth": false,
                "paging" : true,
                "columnDefs" : [
                    {
                        "targets" : [0],    // the access-level (public/private icon)
                        "visible" : cttvConfig.show_access_level,
                        "width" : "3%"
                    },
                    {
                        "targets": [8],
                        "visible": false
                    },
                    {
                        "targets": [3,4,5,7],
                        "width": "14%"
                    },
                    {
                        "targets": [2,6],
                        "width": "10%"
                    }

                ]

            }, $scope.search.info.title+"-common_diseases") );
        };



        // -------------------------------------------------



        var getRareDiseaseData = function(){
            $scope.search.tables.genetic_associations.rare_diseases.is_loading = true;
            var opts = {
                target:$scope.search.target,
                disease:$scope.search.disease,
                size: 1000,
                datasource: cttvConfig.evidence_sources.genetic_association.rare,
                fields: [
                    "disease.efo_info",
                    "evidence",
                    "variant",
                    "type",
                    "access_level"
                ]
            };
            _.extend(opts, searchObj);

            var queryObject = {
                method: 'GET',
                params: opts
            };
            return targetPromise.then(function (snpsLoc) {
                cttvAPIservice.getFilterBy (queryObject)
                .then(
                    function(resp) {
                        if( resp.body.data ){
                            var data = resp.body.data;
                            for (var i=0; i<data.length; i++) {
                                var item = data[i];
                                if (checkPath(item, "variant.id") && item.variant.id[0]){
                                    var rsId = item.variant.id[0].split('/').pop();
                                    if (snpsLoc && snpsLoc[rsId] && variantIsInStructure(snpsLoc[rsId], $scope.search.info.bestStructure)){
                                        data[i].variant.pos = snpsLoc[rsId];
                                    }
                                }
                            }
                            $scope.search.tables.genetic_associations.rare_diseases.data = data;
                            initRareDiseasesTable();
                        } else {
                            $log.warn("Empty response : rare disease");
                        }
                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    //$scope.search.tables.genetic_associations.rare_diseases.is_open = $scope.search.tables.genetic_associations.rare_diseases.data.length>0 || false;
                    $scope.search.tables.genetic_associations.rare_diseases.is_loading = false;
                    // update for parent
                    updateGeneticAssociationsSetting();
                });
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

                    // data origin: public / private
                    row.push( (item.access_level==cttvConsts.ACCESS_LEVEL_PUBLIC) ? accessLevelPublic : accessLevelPrivate );


                    // disease
                    row.push( item.disease.efo_info.label );


                    // mutation
                    var mut = cttvDictionary.NA;
                    if( checkPath(item, "variant.id") && item.variant.id[0]){
                        var rsId = item.variant.id[0].split('/').pop();
                        mut = "<a class='cttv-external-link' href=http://www.ensembl.org/Homo_sapiens/Variation/Explore?v=" + rsId + " target=_blank>" + rsId + "</a>";
                    }
                    row.push(mut);

                    // mutation consequence
                    var cons = "";
                    if( item.type === 'genetic_association' && checkPath(item, "evidence.gene2variant") ){
                        cons = clearUnderscores( getEcoLabel(item.evidence.evidence_codes_info, item.evidence.gene2variant.functional_consequence.split('/').pop() ) );
                        // row.push( clearUnderscores( getEcoLabel(item.evidence.evidence_codes_info, item.evidence.gene2variant.functional_consequence.split('/').pop() ) ) );
                    } else if( item.type === 'somatic_mutation' ){
                        cons = clearUnderscores(item.type);
                        // row.push( clearUnderscores(item.type) );
                    } else {
                        cons = "Curated evidence";
                        // row.push( "Curated evidence" );
                    }
                    // 3D structure?
                    if (item.variant && item.variant.pos) {
                        // var msg3d = "<div><p><a class=cttv-change-view onclick='angular.element(this).scope().showVariantInStructure(" + ~~item.variant.pos.begin + ", " + ~~item.variant.pos.end + ", \"" + item.variant.pos.wildType + "\", \"" + item.variant.pos.alternativeSequence + "\")'>View in 3D</p></a></div>";
                        // row.push($compile(mut + msg3d)($scope)[0].innerHTML);
                        var partial = "<span><a onclick='angular.element(this).scope().showVariantInStructure(" + ~~item.variant.pos.begin + ", " + ~~item.variant.pos.end + ", \"" + item.variant.pos.wildType + "\", \"" + item.variant.pos.alternativeSequence + "\")'>View in 3D</a></span>";
                        cons += "<br/><div class=cttv-change-view>";
                        cons += $compile(partial)($scope)[0].innerHTML;
                        cons += "</div>";
                    }
                    row.push(cons);


                    // evidence source
                    if( item.type === 'genetic_association' && checkPath(item, "evidence.variant2disease") ){
                        row.push( "<a class='cttv-external-link' href='" + item.evidence.variant2disease.urls[0].url + "' target=_blank>" + item.evidence.variant2disease.urls[0].nice_name + "</a>" );

                    } else {
                        // Do some cleaning up for gene2Phenotype:
                        // TODO: this will probably be removed once we reprocess the data and put the nicely formatted text and URL in the data;
                        // I leave the hard coded strings in on purpose, so hopefully I'll remember to remove this in the future.
                        // I'm setting manually:
                        //  1) URL
                        //  2) the text of the link
                        if( db == cttvConsts.dbs.GENE_2_PHENOTYPE ){
                            row.push( "<a class='cttv-external-link' href='http://www.ebi.ac.uk/gene2phenotype/search?panel=ALL&search_term=" + ($scope.search.info.gene.approved_symbol || $scope.search.info.gene.ensembl_external_name) + "' target=_blank>Further details in Gene2Phenotype database</a>" );
                        } else {
                            row.push( "<a class='cttv-external-link' href='" + item.evidence.urls[0].url + "' target=_blank>" + item.evidence.urls[0].nice_name + "</a>" );
                        }

                    }



                    // publications
                    var refs = [];

                    if( item.type === 'genetic_association'){
                        if ( checkPath(item, "evidence.variant2disease.provenance_type.literature") ) {
                            refs = item.evidence.variant2disease.provenance_type.literature.references;
                        } else if( checkPath(item, "evidence.provenance_type.literature.references") ){
                            // this code might be redundant here:
                            // perhaps we don't need to check against genetic_association,
                            // but just check whether there is variant2disease field etc...
                            refs = item.evidence.provenance_type.literature.references;
                        }
                    } else {
                        if( checkPath(item, "evidence.provenance_type.literature.references") ){
                            refs = item.evidence.provenance_type.literature.references;
                        }
                    }

                    var pmidsList = cttvUtils.getPmidsList( refs );
                    row.push( cttvUtils.getPublicationsString( pmidsList ) );

                    // Publication ids (hidden)
                    row.push(pmidsList.join(", "));

                    // 3D structure?
                    // if (item.variant && item.variant.pos) {
                    //     var msg3d = "<div><p><a class=cttv-change-view onclick='angular.element(this).scope().showVariantInStructure(" + ~~item.variant.pos.begin + ", " + ~~item.variant.pos.end + ", \"" + item.variant.pos.wildType + "\", \"" + item.variant.pos.alternativeSequence + "\")'>View in 3D</p></a></div>";
                    //     console.log($compile(msg3d)($scope));
                    //     row.push($compile(msg3d)($scope)[0].innerHTML);
                    // } else {
                    //     row.push("N/A");
                    // }

                    // add the row to data
                    newdata.push(row);

                }catch(e){
                    $scope.search.tables.genetic_associations.rare_diseases.has_errors = true;
                    $log.warn("Error parsing rare disease data:");
                    $log.warn(e);
                }
            });

            return newdata;
        };

        // function mapSnp (mappings, uniprot_pos) {
        //     console.log("uniprot pos...");
        //     console.log(uniprot_pos);
        //     for (var i=0; i<mappings.length; i++) {
        //         var mapping = mappings[i];
        //         if ((mapping.start.residue_number < uniprot_pos) && (mapping.end.residue_number > uniprot_pos)) {
        //             var pdbPos = uniprot_pos - mapping.start.author_residue_number + mapping.start.residue_number;
        //             mapping.pos = pdbPos;
        //             return mapping;
        //         }
        //     }
        //     //return {};
        //     console.error('No mapping found!');
        // }


        // $scope.pdbId = "4uv7";
        // Arguments are: snp start, snp end, chain_id and alternativeAA. Start ant end are in Uniprot coordinates
        $scope.showVariantInStructure = function (start, end, wt, alt) {
            // Get the struct_asym_id and the entity_id for the pdb widget
            var url = "/proxy/www.ebi.ac.uk/pdbe/api/mappings/uniprot_segments/" + $scope.search.info.bestStructure.pdb_id;

            $http.get(url)
                .then (function (mappings) {
                    var clientHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
                    var modal = $uibModal.open({
                        template: "" +
                        "<div class=modal-header>" +
                        "    <div class=snpHeader>" +
                                 $scope.search.info.gene.approved_symbol + " structure (" + $scope.search.info.bestStructure.pdb_id + ")" +
                        "        <div class=pdbLink><a target=_blank href=http://www.ebi.ac.uk/pdbe/entry/pdb/" + $scope.search.info.bestStructure.pdb_id + ">View structure in PDBe</a></div>" +
                        "    </div>" +
                        "</div>" +
                        "<div class='modal-body modal-body-center'>" +
                        "    <div id=picked-atom-name></div>" +
                        "    <div id=snpInPvWidget></div>" +
                        "</div>" +
                        "<div class=snpLegend>" +
                        "    <div class=snpBall></div></span>Protein Variant (" + wt + ">" + alt + ")</span>" +
                        "</div>" +
                        "<div class=modal-footer>" +
                        "    <button class='btn btn-primary' type=button onclick='angular.element(this).scope().$dismiss()'>OK</button>" +
                        "</div>",
                        animation: true,
                        size: 'lg',
                        scope: $scope,
                        windowClass : 'variantStructureModalWindow'
                    });

                    $timeout(function(){
                        var parent = document.getElementById("snpInPvWidget");
                        var options = {
                            width: 400,
                            height: clientHeight * 0.4,
                            antialias: true,
                            quality : 'medium'
                        };
                        var viewer = pv.Viewer(parent, options);

                        // Changes the color of an atom in the structure
                        function setColorForAtom(go, atom, color) {
                            var view = go.structure().createEmptyView();
                            view.addAtom(atom);
                            go.colorBy(pv.color.uniform(color), view);
                        }

                        // variable to store the previously picked atom. Required for resetting the color
                        // whenever the mouse moves.
                        var prevPicked = null;

                        // add mouse move event listener to the div element containing the viewer. Whenever
                        // the mouse moves, use viewer.pick() to get the current atom under the cursor.
                        parent.addEventListener('mousemove', function (event) {
                            var rect = viewer.boundingClientRect();
                            var picked = viewer.pick({
                                x: event.clientX - rect.left,
                                y: event.clientY - rect.top
                            });
                            if (prevPicked !== null && picked !== null &&
                                picked.target() === prevPicked.atom) {
                                return;
                            }
                            if (prevPicked !== null) {
                                // reset color of previously picked atom.
                                setColorForAtom(prevPicked.node, prevPicked.atom, prevPicked.color);
                            }
                            if (picked !== null) {
                                var atom = picked.target();
                                document.getElementById('picked-atom-name').innerHTML = atom ? atom.qualifiedName() : "&nbsp;";
                                // get RGBA color and store in the color array, so we know what it was
                                // before changing it to the highlight color.
                                var color = [0, 0, 0, 0];
                                if (picked.node().getColorForAtom) {
                                    var currCol = picked.node().getColorForAtom(atom, color);

                                    var highlightCol = [1 - currCol[0], 1 - currCol[1], 1 - currCol[2], 1];

                                    prevPicked = {atom: atom, color: color, node: picked.node()};
                                    setColorForAtom(picked.node(), atom, highlightCol);
                                }
                            } else {
                                document.getElementById('picked-atom-name').innerHTML = '&nbsp;';
                                prevPicked = null;
                            }
                            viewer.requestRedraw();
                        });

                        $http.get('https://files.rcsb.org/view/' + $scope.search.info.bestStructure.pdb_id + '.pdb')
                            .then (function (data) {
                                var structure = pv.io.pdb(data.data);
                                viewer.cartoon('protein', structure, {
                                    color: pv.color.bySS()
                                });
                                var pdbSnp = structure.select({'rnum':start});

                                // label
                                var snpVisOpts = {
                                    fontSize : 16, fontColor: '#000000', backgroundAlpha : 0.4
                                };

                                pdbSnp.eachResidue(function (res) {
                                    var label = res.qualifiedName();
                                    var first = res.atom(0).pos();
                                    // We are not using the center because it can lay outside of the backbone structure (using the first atom coords instead)
                                    // var center = res.center();
                                    viewer.label('label', label, first, snpVisOpts);

                                    var cm = viewer.customMesh();
                                    cm.addSphere(first, 1.5, {
                                        color: "orange"
                                    });
                                });

                                viewer.autoZoom();
                            });
                    }, 0);
                });
        };

        var initRareDiseasesTable = function(){
            $('#rare-diseases-table').DataTable( cttvUtils.setTableToolsParams({
                "data": formatRareDiseaseDataToArray($scope.search.tables.genetic_associations.rare_diseases.data),
                "ordering" : true,
                "order": [[1, 'asc']],
                "autoWidth": false,
                "paging" : true,
                "columnDefs" : [
                    {
                        "targets" : [0],    // the access-level (public/private icon)
                        "visible" : cttvConfig.show_access_level,
                        "width" : "3%"
                    },
                    {
                        "targets": [6],
                        "visible": false
                    },
                    {
                        "targets": [2,5],
                        "width": "14%"
                    },
                    {
                        "targets": [3,4],
                        "width": "22%"
                    }
                ],
            }, $scope.search.info.title+"-rare_diseases") );
        };



        // =================================================
        //  D R U G S
        // =================================================


        // DRUGS
        var getDrugData = function () {
            $scope.target = $scope.search.target;
            $scope.disease = $scope.search.disease;
        };


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
            $scope.search.tables.affected_pathways.is_loading = true;
            var opts = {
                target:$scope.search.target,
                disease:$scope.search.disease,
                size: 1000,
                datasource: $scope.search.tables.affected_pathways.source, //cttvConfig.evidence_sources.pathway,
                fields: [
                    "target",
                    "disease",
                    "evidence",
                    "access_level"
                ]
            };
            _.extend(opts, searchObj);
            var queryObject = {
                method: 'GET',
                params: opts
            };
            return cttvAPIservice.getFilterBy (queryObject).
                then(
                    function(resp) {
                        if( resp.body.data ){
                            $scope.search.tables.affected_pathways.data = resp.body.data;
                            initTablePathways();
                        } else {
                            $log.warn("Empty response : pathway data");
                        }
                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    //$scope.search.pathways.is_open = $scope.search.pathways.data.length>0 || false; // might trigger an error...
                    $scope.search.tables.affected_pathways.is_loading = false;
                });
        };


        /*
         *
         */
        var formatPathwaysDataToArray = function(data){
            var newdata = [];
            data.forEach(function(item){
                // create rows:
                var row = [];

                try{

                    // data origin: public / private
                    row.push( (item.access_level==cttvConsts.ACCESS_LEVEL_PUBLIC) ? accessLevelPublic : accessLevelPrivate );

                    // disease
                    row.push(item.disease.efo_info.label);

                    // overview
                    row.push("<a class='cttv-external-link' href='" + item.evidence.urls[0].url+"' target='_blank'>" + item.evidence.urls[0].nice_name + "</a>");

                    // activity
                    row.push( cttvDictionary[item.target.activity.toUpperCase()] || clearUnderscores(item.target.activity) ); // "up_or_down"->"unclassified" via dictionary

                    // mutations
                    var mut = cttvDictionary.NA
                    if(item.evidence.known_mutations && item.evidence.known_mutations.length>0){
                        mut = arrayToList( item.evidence.known_mutations.map(function(i){return i.preferred_name || cttvDictionary.NA;}) , true );
                    }
                    row.push(mut);

                    // evidence codes
                    row.push("Curated in " + item.evidence.provenance_type.database.id );

                    // publications
                    var refs = [];
                    if( checkPath(item, "evidence.provenance_type.literature.references") ){
                        refs = item.evidence.provenance_type.literature.references;
                    }
                    var pmidsList = cttvUtils.getPmidsList( refs );
                    row.push( cttvUtils.getPublicationsString( pmidsList ) );

                    // Publication ids (hidden)
                    row.push(pmidsList.join(", "));



                    newdata.push(row); // use push() so we don't end up with empty rows

                }catch(e){
                    $scope.search.tables.affected_pathways.has_errors = true;
                    $log.error("Error parsing pathways data:");
                    $log.error(e);
                }
            });
            return newdata;
        };



        var initTablePathways = function(){
            $('#pathways-table').DataTable( cttvUtils.setTableToolsParams({
                "data" : formatPathwaysDataToArray($scope.search.tables.affected_pathways.data),
                "ordering" : true,
                "order": [[1, 'asc']],
                "autoWidth": false,
                "paging" : true,
                "columnDefs" : [
                    {
                        "targets" : [0],    // the access-level (public/private icon)
                        "visible" : cttvConfig.show_access_level,
                        "width" : "3%"
                    },
                    {
                        "targets" : [7],
                        "visible" : false
                    },
                    {
                        "targets" : [3,4,5,6],
                        "width" : "14%"
                    },
                    {
                        "targets" : [1],
                        "width" : "18%"
                    }
                ],
            }, $scope.search.info.title+"-disrupted_pathways") );
        };



        // =================================================
        //  RNA expression
        // =================================================



        var getRnaExpressionData = function(){
            $scope.search.tables.rna_expression.is_loading = true;
            var opts = {
                target:$scope.search.target,
                disease:$scope.search.disease,
                size: 1000,
                datasource: $scope.search.tables.rna_expression.source, //cttvConfig.evidence_sources.rna_expression,
                fields: [
                    "disease",
                    "evidence",
                    "target",
                    "access_level"
                ]
            };
            _.extend(opts, searchObj);

            var queryObject = {
                method: 'GET',
                params: opts
            };
            return cttvAPIservice.getFilterBy (queryObject).
                then(
                    function(resp) {
                        if( resp.body.data ){
                            $scope.search.tables.rna_expression.data = resp.body.data;
                            initTableRNA();
                        } else {
                            $log.warn("Empty response : RNA expression");
                        }
                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    //$scope.search.tables.rna_expression.is_open = $scope.search.tables.rna_expression.data.length>0 || false;
                    $scope.search.tables.rna_expression.is_loading = false;
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

                    // data origin: public / private
                    row.push( (item.access_level==cttvConsts.ACCESS_LEVEL_PUBLIC) ? accessLevelPublic : accessLevelPrivate );

                    // disease
                    row.push( item.disease.efo_info.label );

                    // comparison
                    row.push( item.evidence.comparison_name );

                    // activity
                    var activityUrl = item.evidence.urls[0].url;
                    var activity = item.target.activity.split("_").shift();
                    row.push( "<a class='cttv-external-link' href='"+ activityUrl +"' target='_blank'>" + activity +"</a>" );

                    // tissue / cell
                    row.push( item.disease.biosample.name );
                    // row.push( checkPath(data[i], "biological_object.properties.biosamples") ? data[i].biological_object.properties.biosamples : cttvDictionary.NA );

                    // evidence source
                    row.push( getEcoLabel( item.evidence.evidence_codes_info, item.evidence.evidence_codes[0]) );

                    // fold change
                    row.push( item.evidence.log2_fold_change.value );

                    // p-value
                    row.push( (item.evidence.resource_score.value).toExponential(2) );

                    // percentile rank
                    row.push( item.evidence.log2_fold_change.percentile_rank );

                    // experiment overview
                    var expOverview = (item.evidence.urls[2] || item.evidence.urls[0]).url || cttvDictionary.NA;
                    row.push( "<a class='cttv-external-link' href='"+expOverview+"' target='_blank'>" + (item.evidence.experiment_overview || "Experiment overview and raw data") + "</a>" );


                    // publications
                    var refs = [];
                    if( checkPath(item, "evidence.provenance_type.literature.references") ){
                        refs = item.evidence.provenance_type.literature.references;
                    }
                    var pmidsList = cttvUtils.getPmidsList( refs );
                    row.push( cttvUtils.getPublicationsString( pmidsList ) );

                    // Publication ids (hidden)
                    row.push(pmidsList.join(", "));


                    newdata.push(row); // push, so we don't end up with empty rows

                }catch(e){
                    $scope.search.tables.rna_expression.has_errors = true;
                    $log.log("Error parsing RNA-expression data:");
                    $log.log(e);
                }
            });
            //}

            return newdata;
        };



        var initTableRNA = function(){

            $('#rna-expression-table').DataTable( cttvUtils.setTableToolsParams({
                "data": formatRnaDataToArray($scope.search.tables.rna_expression.data),
                "order": [[1, 'asc']],
                "autoWidth": false,
                "paging" : true,
                "columnDefs" : [
                    {
                        "targets" : [0],    // the access-level (public/private icon)
                        "visible" : cttvConfig.show_access_level,
                        "width" : "3%"
                    },
                    {
                        "targets": [11],
                        "visible": false
                    },
                    {
                        "targets" : [6,7,8],
                        "width" : "6%"
                    },
                    {
                        "targets" : [9,10],
                        "width" : "12%"
                    },
                    {
                        "targets" : [2,5],
                        "width" : "13%"
                    },
                    {
                        "targets" : [3,4],
                        "width" : "10%"
                    }
                ],
            }, $scope.search.info.title+"-RNA_expression") );
        };



        // =================================================
        //  S O M A T I C   M U T A T I O N S
        // =================================================



        var getMutationData = function(){
            //$log.log("getMutationData()");
            var opts = {
                target:$scope.search.target,
                disease:$scope.search.disease,
                size: 1000,
                datasource: $scope.search.tables.somatic_mutations.source, //cttvConfig.evidence_sources.somatic_mutation ,
                fields: [
                    "disease.efo_info", // disease
                    "evidence.evidence_codes_info",  // evidence source
                    "evidence.urls",
                    "evidence.known_mutations",
                    "evidence.provenance_type",
                    "evidence.known_mutations",
                    "access_level",
                    "unique_association_fields.mutation_type",
                    "target.activity",
                    "sourceID"
                ]
            };
            _.extend(opts, searchObj);
            $scope.search.tables.somatic_mutations.is_loading = true;
            var queryObject = {
                method: 'GET',
                params: opts
            };
            return cttvAPIservice.getFilterBy (queryObject).
                then(
                    function(resp) {
                        if( resp.body.data ){
                            $scope.search.tables.somatic_mutations.data = resp.body.data;
                            initTableMutations();
                        } else {
                            $log.warn("Empty response : somatic mutations");
                        }
                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    //$scope.search.tables.somatic_mutations.is_open = $scope.search.tables.somatic_mutations.data.length>0 || false;
                    $scope.search.tables.somatic_mutations.is_loading = false;
                });
        };



        /*
         *
         */
        var formatMutationsDataToArray = function(data){
            var newdata = [];
            data.forEach(function(item){
                var row = [];
                try{

                    // col 0: data origin: public / private
                    row.push( (item.access_level==cttvConsts.ACCESS_LEVEL_PUBLIC) ? accessLevelPublic : accessLevelPrivate );

                    // col 1: disease
                    row.push(item.disease.efo_info.label);


                    var mut = cttvDictionary.NA;
                    var samp = cttvDictionary.NA;
                    var patt = cttvDictionary.NA;


                    if(item.evidence.known_mutations){

                        // col 2: mutation type
                        if(item.sourceID == cttvConsts.dbs.INTOGEN){
                            mut = item.target.activity || mut;
                        } else {
                            mut = item.evidence.known_mutations.preferred_name || mut;
                        }



                        // col 3: samples
                        if( item.evidence.known_mutations.number_samples_with_mutation_type ){
                            samp = item.evidence.known_mutations.number_samples_with_mutation_type+"/"+item.evidence.known_mutations.number_mutated_samples || samp;
                        }


                        // col 4: inheritance pattern
                        patt = item.evidence.known_mutations.inheritance_pattern || patt;
                    }


                    row.push( clearUnderscores( mut ) );
                    row.push( samp );
                    row.push( patt );


                    // col 5: evidence source
                    row.push("<a href='"+item.evidence.urls[0].url+"' target='_blank' class='cttv-external-link'>"+item.evidence.urls[0].nice_name+"</a>");

                    // cols 6: publications
                    var refs = [];
                    if( checkPath(item, "evidence.provenance_type.literature.references") ){
                        refs = item.evidence.provenance_type.literature.references;
                    }
                    var pmidsList = cttvUtils.getPmidsList( refs );
                    row.push( cttvUtils.getPublicationsString( pmidsList ) );

                    // col 7: pub ids (hidden)
                    row.push(pmidsList.join(", "));



                    newdata.push(row); // push, so we don't end up with empty rows
                }catch(e){
                    $scope.search.tables.somatic_mutations.has_errors = true;
                    $log.log("Error parsing somatic mutation data:");
                    $log.log(e);
                }
            });

            return newdata;
        };



        var initTableMutations = function(){

            $('#mutations-table').DataTable( cttvUtils.setTableToolsParams({
                "data": formatMutationsDataToArray($scope.search.tables.somatic_mutations.data),
                //"ordering" : true,
                "order": [[1, 'asc']],
                "autoWidth": false,
                "paging" : true,
                "columnDefs" : [
                    {
                        "targets" : [0],    // the access-level (public/private icon)
                        "visible" : cttvConfig.show_access_level,
                        "width" : "3%"
                    },
                    {
                        "targets" : [7],    // the access-level (public/private icon)
                        "visible" : false
                    },
                    // now set the widths
                    {
                        "targets" : [1,2,4,5],
                        "width" : "18%"
                    },
                    {
                        "targets" : [3],
                        "width" : "9%"
                    },
                    /*{
                        "targets" : [4],
                        "width" : "22%"
                    },
                    {
                        "targets" : [0],
                        "width" : "0%"
                    }*/
                ],
            }, $scope.search.info.title+"-somatic_mutations") );
        };



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
            $scope.search.tables.animal_models.is_loading = true;
            var opts = {
                target:$scope.search.target,
                disease:$scope.search.disease,
                size: 1000,
                datasource: $scope.search.tables.animal_models.source, //cttvConfig.evidence_sources.animal_model,
                fields: [
                    "disease",
                    "evidence",
                    "scores",
                    "access_level"
                ]
            };
            _.extend(opts, searchObj);

            var queryObject = {
                method: 'GET',
                params: opts
            };
            return cttvAPIservice.getFilterBy (queryObject).
                then(
                    function(resp) {
                        if( resp.body.data ){
                            $scope.search.tables.animal_models.data = resp.body.data;
                            initTableMouse();
                        } else {
                            $log.warn("Empty response : animal models data");
                        }
                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    //$scope.search.mouse.is_open = $scope.search.mouse.data.length>0 || false;
                    $scope.search.tables.animal_models.is_loading = false;
                });
        };



        /*
         *
         */
        var formatMouseDataToArray = function(data){
            var newdata = [];
            data.forEach(function(item){
                // create rows:
                var row = [];

                try{

                    // data origin: public / private
                    row.push( (item.access_level==cttvConsts.ACCESS_LEVEL_PUBLIC) ? accessLevelPublic : accessLevelPrivate );

                    // disease
                    row.push(item.disease.efo_info.label);    // or item.disease.efo_info.label ???

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
                    row.push(cttvDictionary.PHENODIGM);

                    // score -- hidden column now
                    row.push((item.scores.association_score).toFixed(2));


                    newdata.push(row); // push, so we don't end up with empty rows
                }catch(e){
                    $scope.search.tables.animal_models.has_errors = true;
                    $log.error("Error parsing mouse data:");
                    $log.error(e);
                }
            });

            return newdata;
        };



        var initTableMouse = function(){

            $('#mouse-table').DataTable( cttvUtils.setTableToolsParams({
                "data": formatMouseDataToArray($scope.search.tables.animal_models.data),
                "autoWidth": false,
                "paging" : true,
                "ordering" : true,
                "order": [[6, 'des']],
                "columnDefs" : [
                    {
                        "targets" : [0],    // the access-level (public/private icon)
                        "visible" : cttvConfig.show_access_level,
                        "width" : "3%"
                    },
                    {
                        "targets" : [6],    // score
                        "visible" : false
                    },
                    {
                        "targets" : [2,3,4],
                        "width" : "20%"
                    },
                    {
                        "targets" : [5],
                        "width" : "10%"
                    }
                ],
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
        };



        // =================================================
        //  L I T E R A T U R E
        // =================================================

        /*
        Literature data for the "Text mining" table. Table fields are:
          - Disease: disease name (string)
          - Publication: publication description (string, long text)
          - Year: number
        */

        var getLiteratureTotal = function () {
            $scope.search.tables.literature.is_loading = true;
            var opts = {
                target: $scope.search.target,
                disease: $scope.search.disease,
                size: 0,
                datasource: $scope.search.tables.literature.source
            };
            _.extend(opts, searchObj);
            var queryObject = {
                method: 'GET',
                params: opts
            };
            return cttvAPIservice.getFilterBy (queryObject)
                .then (function (resp) {
                    $scope.search.tables.literature.total = resp.body.total;
                    $scope.search.tables.literature.is_loading = false;
                });
        };


        // =================================================
        //  H E L P E R   M E T H O D S
        // =================================================


        // =================================================
        //  S C O P E   M E T H O D S
        // =================================================

        $scope.sectionOpen=function(who) {
        //    $log.info("tdc:sectionOpen", who);
            // Fire a target associations tree event for piwik to track
            $analytics.eventTrack('evidence', {"category": "evidence", "label": who});
        };

        // =================================================
        //  M A I N   F L O W
        // =================================================

        // $log.info("target-disease-controller");
        var path = $location.path().split("/");
        // $log.info(path);
        // parse parameters
        $scope.search.target = path[2];
        $scope.search.disease = path[3];

        // and fire the info search
        getInfo();
        getSnpPositions();

        // get the data for the flower graph
        getFlowerData()
            .then(function(){
                // then get data for all then
                getCommonDiseaseData();
                getRareDiseaseData();
                getMutationData();
                getDrugData();
                getRnaExpressionData();
                getPathwaysData();
                getLiteratureTotal();
                getMouseData();
            });

        var render = function(new_state, old_state){
            var view = new_state.view || {};
            var sec = view.sec;
            if(sec && sec[0] && $scope.search.tables[ sec[0] ]){
                $scope.search.tables[ sec[0] ].is_open = true;

                // scrolling before we have the data is unlikely to work:
                // at best it will scroll a little bit, but not much, because there won't be any height to allow scolling
                // leaving this here for now.
                // TODO: will have to think of a more elegant way of managing this, for example load all data in sequence
                $anchorScroll( "tables" );
            }
        };

        $scope.$on(cttvLocationState.STATECHANGED, function (e, new_state, old_state) {
            // at the moment this shouldn't be trigger other than when rerouting from an old style link
            render( new_state, old_state );
        });

        // if old link, do a rerouting to new style links
        if( !cttvLocationState.getState()["view"] && cttvLocationState.getState()["sec"] ){
            $location.search( 'view=sec:' + cttvLocationState.getState()["sec"]);
        }

        render(cttvLocationState.getState(), cttvLocationState.getOldState());
    }]);
