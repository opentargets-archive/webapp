
angular.module('cttvControllers')

/**
* TargetCtrl
* Controller for the target page
* It loads information about a given target
*/
.controller ("TargetCtrl", ["$scope", "$location", "$log", "cttvAPIservice", "$http", "$sce", "$q", function ($scope, $location, $log, cttvAPIservice, $http, $sce, $q) {
    "use strict";
    $log.log('TargetCtrl()');

    $scope.targetId = $location.url().split("/")[2];

    cttvAPIservice.getTarget({
        target_id: $scope.targetId
    })
    .then(
        // success
        function (resp) {
            resp = JSON.parse(resp.text);
            $scope.target = {
                label : resp.approved_name || resp.ensembl_external_name,
                symbol : resp.approved_symbol || resp.ensembl_external_name, //resp.approved_symbol || resp.approved_name || resp.ensembl_external_name,
                id : resp.approved_id || resp.ensembl_gene_id,
                description : resp.uniprot_function[0],
                name : resp.approved_name || resp.ensembl_description
            };

            // Synonyms
            var syns = {};
            var synonyms = resp.symbol_synonyms;
            if (synonyms !== undefined) {
                for (var i=0; i<synonyms.length; i++) {
                    syns[synonyms[i]] = 1;
                }
            }
            var prev_symbols = resp.previous_symbols;
            if (prev_symbols !== undefined) {
                for (var j=0; j<prev_symbols.length; j++) {
                    syns[prev_symbols[j]] = 1;
                }
            }
            var name_synonyms = resp.name_synonyms;
            if (name_synonyms !== undefined) {
                for (var k=0; k<name_synonyms.length; k++) {
                    syns[name_synonyms[k]] = 1;
                }
            }
            $log.log(synonyms);
            $scope.synonyms = _.keys(syns);

            // Uniprot
            $scope.uniprot = {
                id : resp.uniprot_id,
                subunits : resp.uniprot_subunit,
                locations : resp.uniprot_subcellular_location,
                accessions : resp.uniprot_accessions,
                keywords : resp.uniprot_keywords
            };

            var FeatureViewer = require("biojs-vis-proteinfeaturesviewer");
            var fvInstance = new FeatureViewer({
                // proxy: "/proxy/",
                el: "#uniprotProteinFeatureViewer",
                uniprotacc: resp.uniprot_accessions[0],
                exclusions: ['seqInfo']
            });

            // Ensembl
            var isHuman = resp.ensembl_gene_id.substring(0,4) === "ENSG";
            $scope.ensembl = {
                id : resp.ensembl_gene_id,
                description : resp.ensembl_description,
                isHuman : isHuman,
                chr : resp.chromosome,
                start : resp.gene_start,
                end : resp.gene_end
            };

            // GO terms
            // var goterms = _.filter(resp.dbxrefs, function (t) {return t.match(/^GO:/)});
            // var cleanGoterms = _.map(goterms, function (t) {return t.substring(3, t.length)});
            // var uniqGoterms = _.uniq(cleanGoterms);
            // $scope.goterms = uniqGoterms;
            // var gos = _.pluck(resp.go, 'term');
            var gosByOntology = {
                'F' : [],
                'C' : [],
                'P' : []
            };

            var gos = _.keys(resp.go);
            for (var ii=0; ii<gos.length; ii++) {
                var goid = gos[ii];
                var ontology = resp.go[goid].term.substring(0,1);
                gosByOntology[ontology].push ({label: resp.go[goid].term.substring(2),
                    goid: goid
                });
            }

            var goArr = [];
            if (gosByOntology.F.length) {
                goArr.push (
                    {
                        "Ontology" : "Molecular Function",
                        "terms" : gosByOntology.F
                    }
                );
            }

            if (gosByOntology.P.length) {
                goArr.push (
                    {
                        "Ontology" : "Biological Process",
                        "terms" : gosByOntology.P
                    }
                );
            }

            if (gosByOntology.C.length) {
                goArr.push (
                    {
                        "Ontology" : "Cellular Component",
                        "terms" : gosByOntology.C
                    }
                );
            }
            console.log ("GO ARR::::");
            console.log(goArr);
            $scope.goterms = goArr;

            // Expression Atlas
            $scope.toggleBaselineExpression = function () {
                $scope.eaTarget = resp.ensembl_gene_id;
            };

            // Genome Browser
            $scope.toggleGenomeLocation = function () {
                $scope.chr = resp.chromosome;
                $scope.genomeBrowserGene = resp.ensembl_gene_id;
            };

            // Transcript Viewer
            // $scope.toggleTranscriptView = function () {
            //     $scope.chr = resp.chromosome;
            //     $scope.transcriptViewerGene = resp.ensembl_gene_id;
            // };

            // Protein structure (PDB)
            var pdb = resp.pdb;
            $scope.pdb = {};
            if (_.isEmpty(pdb)) {
                $scope.pdb.nstructures = 0;
                //return;
            } else {
                var firstStructure = _.sortBy(_.keys(pdb))[0].toLowerCase();
                $scope.pdb.id = firstStructure;
                $scope.pdb.nstructures = _.keys(pdb).length;

                // cttvAPIservice.getProxy({
                //     "url" : "http://www.ebi.ac.uk/pdbe/static/entry/" + firstStructure + "_json",
                // })
                // .then (function (resp) {
                // var data = resp.body;
                // var entryImgs = data[firstStructure].entry.all.image;
                // for (var i=0; i<entryImgs.length; i++) {
                //     if (entryImgs[i].filename === (firstStructure + "_deposited_chain_front")) {
                //         $scope.pdb.thumbnailUrl = "//www.ebi.ac.uk/pdbe/static/entry/" + entryImgs[i].filename + data.image_suffix[2]; // 400x400 image
                //         $scope.pdb.alt = entryImgs[i].alt;
                //         $scope.pdb.description = $sce.trustAsHtml(entryImgs[i].description);
                //         return;
                //     }
                // }
                // });

                $http.get("/proxy/www.ebi.ac.uk/pdbe/static/entry/" + firstStructure + "_json")
                    .success (function (data) {
                        var entryImgs = data[firstStructure].entry.all.image;
                        for (var i=0; i<entryImgs.length; i++) {
                            if (entryImgs[i].filename === (firstStructure + "_deposited_chain_front")) {
                                $scope.pdb.thumbnailUrl = "//www.ebi.ac.uk/pdbe/static/entry/" + entryImgs[i].filename + data.image_suffix[2]; // 400x400 image
                                $scope.pdb.alt = entryImgs[i].alt;
                                //$scope.pdb.description = $sce.trustAsHtml(entryImgs[i].description);
                                return;
                            }
                        }
                    })
                    .error (function (data) {
                        console.log("ERROR FROM PDB:");
                        console.log(data);
                    });
            }


            // Orthologues
            // var ensemblApi = tnt.ensembl();
            // var orthUrl = ensemblApi.url.homologues({
            //     id: resp.ensembl_gene_id
            // });
            // ensemblApi.call(orthUrl)
            //     .then (function (orthResp) {
            //         var data = orthResp.body;
            //     });
            $scope.targetGeneId = resp.ensembl_gene_id;

            // Pathways
            // Genome Browser
            $scope.togglePathwayViewer = function () {
                var pathways = resp.reactome;
                var reactomePathways = [];

                // Get the new identifiers
                var promises = [];
                var pathwayArr = [];
                for (var pathway in pathways) {
                    var p = $http.get("/proxy/www.reactome.org/ReactomeRESTfulAPI/RESTfulWS/queryById/DatabaseObject/" + pathway + "/stableIdentifier");
                    promises.push(p);
                    pathwayArr.push(pathways[pathway]["pathway name"]);
                }
                $q
                    .all(promises)
                    .then(function (vals) {
                        for (var i=0; i<vals.length; i++) {
                            var val = vals[i].data;
                            var idRaw = val.split("\t")[1];
                            var id = idRaw.split('.')[0];
                            reactomePathways.push({
                                "id": id,
                                "name" : pathwayArr[i]
                            });
                        }
                        $scope.pathways = reactomePathways;
                        if ($scope.pathways[0]) {
                            $scope.setPathwayViewer($scope.pathways[0]);
                        }
                    });

            };
            $scope.setPathwayViewer = function (pathway) {
                $scope.pathway = {
                    id: pathway.id,
                };
            };




            // Drugs
            // var drugs = resp.drugbank;
            // $scope.drugs = drugs;


            // Bibliography
            var bibliography = _.filter(resp.dbxrefs, function (t) {
                return t.match(/^PubMed/);
            });
            var cleanBibliography = _.map (bibliography, function (t) {
                return t.substring(7, t.lenght);
            });
            //var bibliographyStr = cleanBibliography.join (",");
            var pmidsLinks = (_.map(cleanBibliography, function (p) {
                return "EXT_ID:" + p;
            })).join (" OR ");
            $scope.citations = {};

            $http.get("/proxy/www.ebi.ac.uk/europepmc/webservices/rest/search?query=" + pmidsLinks + "&format=json")
                .then (function (resp) {
                    $scope.citations.count = resp.data.hitCount;
                    $scope.citations.europepmcLink = "//europepmc.org/search?query=" + pmidsLinks;
                    var citations = resp.data.resultList.result;
                    for (var i=0; i<citations.length; i++) {
                        var authorStr = citations[i].authorString;
                        if (authorStr[authorStr.length-1] === ".") {
                            authorStr = authorStr.slice(0,-1);
                        }
                        var authors = authorStr.split(', ');
                        citations[i].authors = authors;
                    }
                    $scope.citations.all = resp.data.resultList.result;
                });

            // Bibliography
            // var bibliography = _.filter(resp.dbxrefs, function (t) {return t.match(/^PubMed/);});
            // var cleanBibliography = _.map(bibliography, function (t) {return t.substring(7, t.length);});
            // var bibliographyStr = cleanBibliography.join (",");
            // $scope.pmids = bibliographyStr;
            // $scope.pmidsLinks = (_.map(cleanBibliography,function (p) {return "EXT_ID:" + p;})).join(" OR ");

        },
        // error handler
        cttvAPIservice.defaultErrorHandler
    );
}]);
