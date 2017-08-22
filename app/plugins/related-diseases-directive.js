angular.module('plugins')
    .directive('relatedDiseases', ['$log', 'cttvUtils', 'cttvConsts', 'cttvDictionary', 'cttvAPIservice', '$timeout', function ($log, cttvUtils, cttvConsts, cttvDictionary, cttvAPIservice, $timeout) {
        'use strict';

        // Details table --
        // var colorScale = cttvUtils.colorScales.BLUE_0_1; //blue orig
        var colorScale = cttvUtils.colorScales.BLUE_RED; // blue <-> red

        var currTable;
        var spDiv;

        /*
        * Generates and returns the string representation of the span element
        * with color information for each cell
        */
        // var getColorStyleString = function(value, href){
        //     var str="";
        //     if( value<=0 ){
        //         str = "<span class='no-data' title='No data'></span>"; // quick hack: where there's no data, we don't put anything, so the sorting works better
        //     } else {
        //         str = "<span style='color: "+colorScale(value)+"; background: "+colorScale(value)+";' title='Score: "+cttvUtils.floatPrettyPrint(value)+"'>"+cttvUtils.floatPrettyPrint(value)+"</span>";
        //         if( href ){
        //             str = "<a href=" + href + ">" + str + "</a>";
        //         }
        //     }
        //     return str;
        // };

        // var getColorStyleString = function (value1, value2, href) {
        //     var str = "";
        //     var delta = value1-value2;
        //     var opacity = (value1 + value2) / 2;
        //     str = "<span style='color:" + colorScale(delta) + "; background:" + colorScale(delta) + "; opacity:" + opacity + "' title= Score: "+cttvUtils.floatPrettyPrint(delta)+"'>"+cttvUtils.floatPrettyPrint(delta)+"</span>";
        //
        //     if (href){
        //         str = "<a href=" + href + ">" + str + "</a>";
        //     }
        //
        //     return str;
        // };

        var getColorStyleString = function (value1, value2, hrefObj, hrefSbj) {
            var str = '';
            var width = 28;
            var barScale1 = d3.scale.linear()
                .domain([0, 1])
                .range([0, width]); // Each cell is 48px
            str = '<div style=\'background:#EEEEEE; color:#EEEEEE\'><a href=' + hrefObj + '><div style=\'display:inline-block; height:15px; width:' + barScale1(value1) + 'px; background:#582A72; margin-left:' + (width-barScale1(value1)) + 'px;\'></div></a><a href=' + hrefSbj + '><div style=\'display:inline-block; height:15px; width:' + barScale1(value2) + 'px; background:#AAAA39;\'></div></a>' + cttvUtils.floatPrettyPrint(value1) + '</div>';

            return str;
        };

        var cols = [
            {name:'', title:cttvDictionary.TARGET_SYMBOL},
            {name:'', title:cttvDictionary.ENSEMBL_ID},

            // Datatypes for the OBJECT
            {name:'', title:cttvDictionary.ASSOCIATION_SCORE},
            {name:cttvConsts.datatypes.GENETIC_ASSOCIATION, title:cttvDictionary[cttvConsts.datatypes.GENETIC_ASSOCIATION.toUpperCase()]},
            {name:cttvConsts.datatypes.SOMATIC_MUTATION, title:cttvDictionary[cttvConsts.datatypes.SOMATIC_MUTATION.toUpperCase()]},
            {name:cttvConsts.datatypes.KNOWN_DRUG, title:cttvDictionary[cttvConsts.datatypes.KNOWN_DRUG.toUpperCase()]},
            {name:cttvConsts.datatypes.AFFECTED_PATHWAY, title:cttvDictionary[cttvConsts.datatypes.AFFECTED_PATHWAY.toUpperCase()]},
            {name:cttvConsts.datatypes.RNA_EXPRESSION, title:cttvDictionary[cttvConsts.datatypes.RNA_EXPRESSION.toUpperCase()]},
            {name:cttvConsts.datatypes.LITERATURE, title:cttvDictionary[cttvConsts.datatypes.LITERATURE.toUpperCase()]},
            {name:cttvConsts.datatypes.ANIMAL_MODEL, title:cttvDictionary[cttvConsts.datatypes.ANIMAL_MODEL.toUpperCase()]},
            {name:'', title:'total score'},

            // empty col for the gene name
            {name:'', title:cttvDictionary.TARGET_NAME}
        ];

        //setup the table
        var setupTable = function (table, data, filename) {
            currTable = $(table).DataTable({
                'dom': '<"clearfix" <"clear small" i><"pull-left small" f><"pull-right"<"#cttvTableDownloadIcon">>rt<"pull-left small" l><"pull-right small" p>>',
                'processing': false,
                'data': data,
                'columns': (function(){
                    var a=[];
                    for(var i=0; i<cols.length; i++){
                        a.push({ 'title': '<div><span title=\''+cols[i].title+'\'>'+cols[i].title+'</span></div>', 'name':cols[i].name });
                    }
                    return a;
                })(),
                'columnDefs' : [
                    {
                        'targets' : [1,10],
                        'visible' : false
                    },
                    {
                        'targets' : [1,11],
                        'orderable': false
                    },
                    { 'orderSequence': ['desc', 'asc'], 'targets': [2,3,4,5,6,7,8,9,10] },
                    { 'orderSequence': ['asc', 'desc'], 'targets': [0]}
                ],
                'order': [],
                'orderMulti': true,
                'autoWidth': false,
                'ordering': true,
                'lengthMenu': [[20, 100, 500], [20, 100, 500]],
                'pageLength': 20,
                'language': {
                    // "lengthMenu": "Display _MENU_ records per page",
                    // "zeroRecords": "Nothing found - sorry",
                    'info': 'Showing _START_ to _END_ of _TOTAL_ shared targets',
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
                    resp[d.disease.id] = {};
                }
                resp[d.disease.id][d.target.id] = d;
            }
            return resp;
        }

        function getData (object, subject, targets, table, filename) {

            var paramsObj = {};
            paramsObj.disease = [object, subject];
            paramsObj.target = targets.slice(0, 100);
            paramsObj.size = 200;
            paramsObj.direct = true;
            paramsObj.facets = false;
            // TODO: Include POST in cttvAPIservice
            var cttvApi = cttvAPIservice.getSelf(); // No POST in the service yet
            var url = cttvApi.url.associations();

            cttvApi.call(url, paramsObj)
                // .then (function (resp) {
                //     var bestTargets = getBestSharedTargets(resp.body.data, 100);
                //     var url = cttvApi.url.associations();
                //     var opts = {
                //         disease: [object, subject],
                //         target: bestTargets,
                //         size: 200,
                //         direct: true,
                //         facets: false,
                //     };
                //     return cttvApi.call(url, opts);
                // })
                .then (function (resp) {
                    var splitData = splitDataIntoDiseases(resp.body.data);
                    var dtData = parseData(splitData, object, subject, targets.slice(0, 100));
                    spDiv.parentNode.removeChild(spDiv);
                    setupTable(table, dtData, filename);
                });
        }

        function parseData (data, object, subject, targets) {
            var newData = new Array(data.length);
            for (var i=0; i<targets.length; i++) {
            //for (var i=0; i<data[object].length; i++) {
                var target = targets[i];
                var objAssoc = data[object][target];
                var sbjAssoc = data[subject][target];
                var objDts = objAssoc.association_score.datatypes;
                var sbjDts = sbjAssoc.association_score.datatypes;
                var row = [];
                var geneLoc = '/target/' + objAssoc.target.id + '/associations';
                var geneObjDiseaseLoc = '/evidence/' + objAssoc.target.id + '/' + objAssoc.disease.id;
                var geneSbjDiseaseLoc = '/evidence/' + sbjAssoc.target.id + '/' + sbjAssoc.disease.id;

                // Name
                row.push('<a href=' + geneLoc + ' title=' + objAssoc.target.gene_info.symbol + '>' + objAssoc.target.gene_info.symbol + '</a>');
                // Ensembl ID
                row.push(objAssoc.target.id);

                // OBJECT...
                // Association score
                row.push(getColorStyleString(objAssoc.association_score.overall, sbjAssoc.association_score.overall, geneObjDiseaseLoc, geneSbjDiseaseLoc));
                // Genetic association
                row.push( getColorStyleString( objDts.genetic_association, sbjDts.genetic_association, geneObjDiseaseLoc + (geneObjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + 'sec=genetic_associations', geneSbjDiseaseLoc + (geneSbjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + 'sec=genetic_associations') );
                // Somatic mutation
                row.push( getColorStyleString( objDts.somatic_mutation, sbjDts.somatic_mutation, geneObjDiseaseLoc +    (geneObjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + 'sec=somatic_mutations', geneSbjDiseaseLoc +    (geneSbjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + 'sec=somatic_mutations') );
                // Known drug
                row.push( getColorStyleString( objDts.known_drug, sbjDts.known_drug, geneObjDiseaseLoc + (geneObjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + 'sec=known_drugs', geneSbjDiseaseLoc + (geneSbjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + 'sec=known_drugs') );
                // Affected pathway
                row.push( getColorStyleString( objDts.affected_pathway, sbjDts.affected_pathway, geneObjDiseaseLoc +    (geneObjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + 'sec=affected_pathways', geneSbjDiseaseLoc +    (geneSbjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + 'sec=affected_pathways') );
                // Expression atlas
                row.push( getColorStyleString( objDts.rna_expression, sbjDts.rna_expression, geneObjDiseaseLoc +      (geneObjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + 'sec=rna_expression', geneSbjDiseaseLoc +      (geneSbjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + 'sec=rna_expression') );
                // Literature
                row.push( getColorStyleString( objDts.literature, sbjDts.literature, geneObjDiseaseLoc +(geneObjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + 'sec=literature', geneSbjDiseaseLoc +(geneSbjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + 'sec=literature'));
                // Animal model
                row.push( getColorStyleString( objDts.animal_model, sbjDts.animal_model, geneObjDiseaseLoc +        (geneObjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + 'sec=animal_models', geneSbjDiseaseLoc +        (geneSbjDiseaseLoc.indexOf('?')==-1 ? '?' : '&') + 'sec=animal_models') );

                // Total score
                row.push( objDts.genetic_association+
                    objDts.somatic_mutation+
                    objDts.known_drug+
                    objDts.rna_expression+
                    objDts.affected_pathway+
                    objDts.animal_model);

                row.push('<a href=\'' + geneLoc + '\' title=\''+objAssoc.target.gene_info.name+'\'>' + objAssoc.target.gene_info.name + '</a>');

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
                // scope.changedScore = function (newScore) {
                // };

                // Populate overview
                $timeout (function () {
                    var v = vis()
                        .disease(scope.disease.efo)
                        .skip(1)
                        .size(600)
                        .score('jackard_weighted')
                        .cttvApi(cttvAPIservice.getSelf());

                    // v.on("load", function (d) {
                    //     $log.log("LOADED------------------------------------");
                    //     $log.log(Object.keys(d[0].scores));
                    //     scope.scores = Object.keys(d[0].scores);
                    // });

                    // Populate details on node click:
                    v.on('click', function (d) {
                        // Set the spinner...
                        spDiv = document.createElement('div');
                        var sp = spinner()
                            .size(30)
                            .stroke(3);
                        element[0].appendChild(spDiv);
                        sp(spDiv);

                        // Set the header...
                        var container = document.getElementById('relatedDiseasesDetailsHeader');
                        container.innerHTML = '';
                        var h4 = document.createElement('h4');
                        h4.innerText = 'Details';

                        // Disease names with color
                        var divHeader = document.createElement('div');
                        var pD1 = document.createElement('span');
                        pD1.style['font-weight'] = 'bold';
                        pD1.style.color = '#582A72';
                        pD1.innerText = d.object.label;

                        var pVs = document.createElement('text');
                        pVs.innerText = ' vs ';

                        var pD2 = document.createElement('span');
                        pD2.style['font-weight'] = 'bold';
                        pD2.style.color = '#AAAA39';
                        pD2.innerText = d.subject.label;
                        container.appendChild(h4);
                        container.appendChild(pD1);
                        container.appendChild(pVs);
                        container.appendChild(pD2);

                        // Destroy prev table if exists
                        if (currTable) {
                            currTable.destroy();
                        }
                        var filename = 'shared_targets_' + d.subject.id + '-' + d.object.id;
                        scope.subject = d.subject.label;
                        var table = document.getElementById('relatedDiseasesDetailsTable');
                        table.innerHTML = '';
                        getData(d.object.id, d.subject.id, d.shared_targets, table, filename);
                    });

                    v(document.getElementById('relatedDiseasesOverview'));
                }, 0);

            }
        };
    }]);
