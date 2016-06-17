angular.module('plugins')
    .directive('relatedDiseases', ['$log', 'cttvUtils', 'cttvConsts', 'cttvDictionary', 'cttvAPIservice', '$timeout', function ($log, cttvUtils, cttvConsts, cttvDictionary, cttvAPIservice, $timeout) {
        "use strict";

        // Details table --
        var colorScale = cttvUtils.colorScales.BLUE_0_1; //blue orig

        var currTable;
        var spDiv;

        /*
        * Generates and returns the string representation of the span element
        * with color information for each cell
        */
        var getColorStyleString = function(value, href){
            var str="";
            if( value<=0 ){
                str = "<span class='no-data' title='No data'></span>"; // quick hack: where there's no data, we don't put anything, so the sorting works better
            } else {
                str = "<span style='color: "+colorScale(value)+"; background: "+colorScale(value)+";' title='Score: "+cttvUtils.floatPrettyPrint(value)+"'>"+cttvUtils.floatPrettyPrint(value)+"</span>";
                if( href ){
                    str = "<a href=" + href + ">" + str + "</a>";
                }
            }

            return str;
        };

        var cols = [
            {name:"", title:cttvDictionary.TARGET_SYMBOL},
            {name:"", title:cttvDictionary.ENSEMBL_ID},

            // Datatypes for the OBJECT
            {name:"", title:cttvDictionary.ASSOCIATION_SCORE},
            {name:cttvConsts.datatypes.GENETIC_ASSOCIATION, title:cttvDictionary[cttvConsts.datatypes.GENETIC_ASSOCIATION.toUpperCase()]},
            {name:cttvConsts.datatypes.SOMATIC_MUTATION, title:cttvDictionary[cttvConsts.datatypes.SOMATIC_MUTATION.toUpperCase()]},
            {name:cttvConsts.datatypes.KNOWN_DRUG, title:cttvDictionary[cttvConsts.datatypes.KNOWN_DRUG.toUpperCase()]},
            {name:cttvConsts.datatypes.AFFECTED_PATHWAY, title:cttvDictionary[cttvConsts.datatypes.AFFECTED_PATHWAY.toUpperCase()]},
            {name:cttvConsts.datatypes.RNA_EXPRESSION, title:cttvDictionary[cttvConsts.datatypes.RNA_EXPRESSION.toUpperCase()]},
            {name:cttvConsts.datatypes.LITERATURE, title:cttvDictionary[cttvConsts.datatypes.LITERATURE.toUpperCase()]},
            {name:cttvConsts.datatypes.ANIMAL_MODEL, title:cttvDictionary[cttvConsts.datatypes.ANIMAL_MODEL.toUpperCase()]},
            {name:"", title:"total score"},

            // Datatypes for the SUBJECT
            {name:"", title:cttvDictionary.ASSOCIATION_SCORE},
            {name:cttvConsts.datatypes.GENETIC_ASSOCIATION, title:cttvDictionary[cttvConsts.datatypes.GENETIC_ASSOCIATION.toUpperCase()]},
            {name:cttvConsts.datatypes.SOMATIC_MUTATION, title:cttvDictionary[cttvConsts.datatypes.SOMATIC_MUTATION.toUpperCase()]},
            {name:cttvConsts.datatypes.KNOWN_DRUG, title:cttvDictionary[cttvConsts.datatypes.KNOWN_DRUG.toUpperCase()]},
            {name:cttvConsts.datatypes.AFFECTED_PATHWAY, title:cttvDictionary[cttvConsts.datatypes.AFFECTED_PATHWAY.toUpperCase()]},
            {name:cttvConsts.datatypes.RNA_EXPRESSION, title:cttvDictionary[cttvConsts.datatypes.RNA_EXPRESSION.toUpperCase()]},
            {name:cttvConsts.datatypes.LITERATURE, title:cttvDictionary[cttvConsts.datatypes.LITERATURE.toUpperCase()]},
            {name:cttvConsts.datatypes.ANIMAL_MODEL, title:cttvDictionary[cttvConsts.datatypes.ANIMAL_MODEL.toUpperCase()]},
            {name:"", title:"total score"},

            // empty col for the gene name
            {name:"", title:cttvDictionary.TARGET_NAME}
        ];

        //setup the table
        var setupTable = function (table, data, filename) {
            currTable = $(table).DataTable({
                "dom": '<"clearfix" <"clear small" i><"pull-left small" f><"pull-right"<"#cttvTableDownloadIcon">>rt<"pull-left small" l><"pull-right small" p>>',
                "processing": false,
                "data": data,
                "columns": (function(){
                    var a=[];
                    for(var i=0; i<cols.length; i++){
                        a.push({ "title": "<div><span title='"+cols[i].title+"'>"+cols[i].title+"</span></div>", "name":cols[i].name });
                    }
                    return a;
                })(),
                "columnDefs" : [
                    {
                        "targets" : [1,10,19],
                        "visible" : false
                    },
                    {
                        "targets" : [1,20],
                        "orderable": false
                    },
                    { "orderSequence": ["desc", "asc"], "targets": [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19] },
                    { "orderSequence": ["asc", "desc"], "targets": [0]}
                ],
                "order": [2, "desc"],
                "orderMulti": true,
                "autoWidth": false,
                "ordering": true,
                "lengthMenu": [[20, 100, 500], [20, 100, 500]],
                "pageLength": 20,
                "language": {
                    // "lengthMenu": "Display _MENU_ records per page",
                    // "zeroRecords": "Nothing found - sorry",
                    "info": "Showing _START_ to _END_ of _TOTAL_ targets",
                    // "infoEmpty": "No records available",
                    // "infoFiltered": "(filtered from _MAX_ total records)"
                }

            }, filename);

            return t;
        };

        function getBestSharedTargets (data, max) {
            var targets = {};
            var n = 0;
            for (var i=0; i<data.length; i++) {
                var t = data[i].target.id;
                if (!targets[t]) {
                    targets[t] = 1;
                    n++;
                    if (n==max) {
                        break;
                    }
                }
            }
            return Object.keys(targets);
        }

        function splitDataIntoDiseases (data) {
            var resp = {};
            for (var i=0; i<data.length; i++) {
                var d = data[i];
                if (!resp[d.disease.id]) {
                    resp[d.disease.id] = [];
                }
                resp[d.disease.id].push(d);
            }
            return resp;
        }

        function getData (object, subject, targets, table, filename) {

            var paramsObj = {};
            paramsObj.disease = [object, subject];
            paramsObj.target = targets;
            paramsObj.size = 200;
            paramsObj.direct = true;
            paramsObj.facets = false;
            // TODO: Include POST in cttvAPIservice
            var cttvApi = cttvAPIservice.getSelf(); // No POST in the service yet
            var url = cttvApi.url.associations();

            cttvApi.call(url, paramsObj)
                .then (function (resp) {
                    var bestTargets = getBestSharedTargets(resp.body.data, 100);
                    var url = cttvApi.url.associations();
                    var opts = {
                        disease: [object, subject],
                        target: bestTargets,
                        size: 200,
                        direct: true,
                        facets: false,
                    };
                    return cttvApi.call(url, opts);
                })
                .then (function (resp) {
                    var splitData = splitDataIntoDiseases(resp.body.data);
                    var dtData = parseData(splitData, object, subject);
                    spDiv.parentNode.removeChild(spDiv);
                    setupTable(table, dtData, filename);
                });
        }

        function parseData (data, object, subject) {
            var newData = new Array(data.length);
            for (var i=0; i<data[object].length; i++) {
                var objDts = data[object][i].association_score.datatypes;
                var sbjDts = data[subject][i].association_score.datatypes;
                var row = [];
                var geneLoc = "/target/" + data[object][i].target.id;
                var geneObjDiseaseLoc = "/evidence/" + data[object][i].target.id + "/" + data[object][i].disease.id;
                var geneSbjDiseaseLoc = "/evidence/" + data[subject][i].target.id + "/" + data[subject][i].disease.id;

                // Name
                row.push("<a href=" + geneLoc + " title=" + data[object][i].target.gene_info.symbol + ">" + data[object][i].target.gene_info.symbol + "</a>");
                // Ensembl ID
                row.push(data[object][i].target.id);

                // OBJECT...
                // Association score
                row.push(getColorStyleString(data[object][i].association_score.overall, geneObjDiseaseLoc));
                // Genetic association
                row.push( getColorStyleString( objDts.genetic_association, geneObjDiseaseLoc + (geneObjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=genetic_associations") );
                // Somatic mutation
                row.push( getColorStyleString( objDts.somatic_mutation, geneObjDiseaseLoc +    (geneObjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=somatic_mutations") );
                // Known drug
                row.push( getColorStyleString( objDts.known_drug, geneObjDiseaseLoc + (geneObjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=known_drugs") );
                // Affected pathway
                row.push( getColorStyleString( objDts.affected_pathway, geneObjDiseaseLoc +    (geneObjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=affected_pathways") );
                // Expression atlas
                row.push( getColorStyleString( objDts.rna_expression, geneObjDiseaseLoc +      (geneObjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=rna_expression") );
                // Literature
                row.push( getColorStyleString( objDts.literature, geneObjDiseaseLoc +(geneObjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=literature"));
                // Animal model
                row.push( getColorStyleString( objDts.animal_model, geneObjDiseaseLoc +        (geneObjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=animal_models") );

                // Total score
                row.push( objDts.genetic_association+
                    objDts.somatic_mutation+
                    objDts.known_drug+
                    objDts.rna_expression+
                    objDts.affected_pathway+
                    objDts.animal_model);

                // SUBJECT
                // Association score
                row.push(getColorStyleString(data[subject][i].association_score.overall, geneSbjDiseaseLoc));
                // Genetic association
                row.push( getColorStyleString( sbjDts.genetic_association, geneSbjDiseaseLoc + (geneSbjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=genetic_associations") );
                // Somatic mutation
                row.push( getColorStyleString( sbjDts.somatic_mutation, geneSbjDiseaseLoc +    (geneSbjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=somatic_mutations") );
                // Known drug
                row.push( getColorStyleString( sbjDts.known_drug, geneSbjDiseaseLoc + (geneSbjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=known_drugs") );
                // Affected pathway
                row.push( getColorStyleString( sbjDts.affected_pathway, geneSbjDiseaseLoc +    (geneSbjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=affected_pathways") );
                // Expression atlas
                row.push( getColorStyleString( sbjDts.rna_expression, geneSbjDiseaseLoc +      (geneSbjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=rna_expression") );
                // Literature
                row.push( getColorStyleString( sbjDts.literature, geneSbjDiseaseLoc +(geneSbjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=literature"));
                // Animal model
                row.push( getColorStyleString( sbjDts.animal_model, geneSbjDiseaseLoc +        (geneSbjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + "sec=animal_models") );

                // Total score
                row.push( sbjDts.genetic_association+
                    sbjDts.somatic_mutation+
                    sbjDts.known_drug+
                    sbjDts.rna_expression+
                    sbjDts.affected_pathway+
                    sbjDts.animal_model);


                row.push("<a href='" + geneLoc + "' title='"+data[object][i].target.gene_info.name+"'>" + data[object][i].target.gene_info.name + "</a>");

                newData[i] = row;
            }
            return newData;
        }


        return {
            restrict: 'E',
            templateUrl: 'plugins/related-diseases.html',
            scope: {
                disease: '=',
                width: '='
            },
            link: function (scope, element, attrs) {
                // Populate overview
                $timeout (function () {
                    var v = vis()
                        .disease(scope.disease.efo)
                        .size(800)
                        .cttvApi(cttvAPIservice.getSelf());

                    // Populate details on node click:
                    v.on("click", function (d) {
                        // Set the spinner...
                        spDiv = document.createElement("div");
                        var sp = spinner()
                            .size(30)
                            .stroke(3);
                        element[0].appendChild(spDiv);
                        sp(spDiv);

                        // Set the header...
                        var container = document.getElementById("relatedDiseasesDetailsHeader");
                        container.innerHTML = "";
                        var h4 = document.createElement("h4");
                        h4.innerText = "Details";
                        var p = document.createElement("p");
                        p.style["font-weight"] = "bold";
                        p.innerText = d.object.label + " vs " + d.subject.label;
                        container.appendChild(h4);
                        container.appendChild(p);

                        // Destroy prev table if exists
                        if (currTable) {
                            currTable.destroy();
                        }
                        var filename = "shared_targets_" + d.subject.id + "-" + d.object.id;
                        scope.subject = d.subject.label;
                        var table = document.getElementById("relatedDiseasesDetailsTable");
                        table.innerHTML = "";
                        getData(d.object.id, d.subject.id, d.shared_targets, table, filename);
                    });

                    v(document.getElementById("relatedDiseasesOverview"));
                }, 0);

            }
        };
    }]);
