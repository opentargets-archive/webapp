/* Evidence tables Directives */

angular.module('cttvDirectives')

/* Directive to display the known drug evidence table */
.directive('knownDrugTable', ['$log', 'cttvAPIservice', 'cttvConsts', 'cttvUtils', '$location', function ($log, cttvAPIservice, cttvConsts, cttvUtils, $location) {

    'use strict';
    var dbs = cttvConsts.dbs;
    var searchObj = cttvUtils.search.translateKeys($location.search());
    var checkPath = cttvUtils.checkPath;

    return {
        restrict: 'EA',
        templateUrl: 'partials/known-drug-table.html',
        scope: {},
        link: function (scope, elem, attrs) {
            scope.drugs = ["one", "two"];
            scope.$watchGroup([function () {return attrs.target;}, function () {return attrs.disease;}], function () {
                console.log(attrs.target + " -- " + attrs.disease);
                if (!attrs.target && !attrs.disease) {
                    return;
                }
                getDrugData();

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

                function getDrugData (){
                    // $scope.search.drugs.is_loading = true;
                    var opts = {
                        // target:attrs.target,
                        // disease:attrs.disease,
                        size: 1000,
                        datasource: dbs.CHEMBL,
                        fields: [
                            "disease.efo_info",
                            "drug",
                            "evidence",
                            "target",
                        ]
                    };
                    if (attrs.target) {
                        opts.target = attrs.target;
                    }
                    if (attrs.disease) {
                        opts.disease = attrs.disease;
                    }
                    _.extend(opts, searchObj);
                    return cttvAPIservice.getFilterBy( opts ).
                    then(
                        function(resp) {
                            scope.data = resp.body.data;
                            initTableDrugs();

                        },
                        cttvAPIservice.defaultErrorHandler
                    ).
                    finally(function(){
                        //$scope.search.drugs.is_open = $scope.search.drugs.data.length>0 || false;
                        //$scope.search.drugs.is_loading = false;
                    });
                }


                function formatDrugsDataToArray (data){
                    var newdata = [];
                    var unique_drugs = {};
                    data.forEach(function(item){
                        // create rows:
                        var row = [];

                        try{

                            // Fill the unique drugs
                            unique_drugs[item.drug.molecule_name] = 1;

                            // 0: disease
                            row.push(item.disease.efo_info[0].label);

                            // 1: drug
                            row.push( "<a href='"+item.evidence.target2drug.urls[0].url+"' target='_blank'>" +
                            item.drug.molecule_name +
                            " <i class='fa fa-external-link'></i></a>");

                            // 2: phase
                            row.push(item.drug.max_phase_for_all_diseases.label);

                            // 2: hidden
                            row.push(item.drug.max_phase_for_all_diseases.numeric_index);

                            // 3: type
                            row.push(item.drug.molecule_type);

                            // 4: Mechanism of action
                            var pubs = 0;
                            if( checkPath(item, "evidence.target2drug.provenance_type.literature.references") ){
                                pubs = item.evidence.target2drug.provenance_type.literature.references.length;
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
                                    pub+="<a href='"+lit.lit_id+"' target='_blank'>"+lit.lit_id.split('/').pop()+" <i class='fa fa-external-link'></i></a> ";
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

                            // 9: evidence source
                            row.push( "Curated from <br /><a href='" +
                            item.evidence.drug2clinic.urls[0].url +
                            "' target='_blank'>" + item.evidence.drug2clinic.urls[0].nice_name + " <i class='fa fa-external-link'></i></a>");

                            //row.push(data[i].evidence.evidence_codes_info[0][0].label);    // Evidence codes


                            newdata.push(row); // use push() so we don't end up with empty rows
                        }catch(e){
                            $log.log("Error parsing drugs data:");
                            $log.log(e);
                        }
                    });

                    console.log(Object.keys(unique_drugs));
                    scope.drugs = Object.keys(unique_drugs);
                    return newdata;
                }

                /*
                * This is the hardcoded data for the Known Drugs table and
                * will obviously need to change and pull live data when available
                */
                function initTableDrugs (){
                    //$('#drugs-table') // Not anymore
                    var table = elem[0].getElementsByTagName("table");
                    $(table).dataTable( cttvUtils.setTableToolsParams({
                        "data": formatDrugsDataToArray(scope.data),
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
                        //}, $scope.search.info.title+"-known_drugs") );
                    }, "-known_drugs"));
                }

            });
        }
    };
}]);
