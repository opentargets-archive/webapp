angular.module('plugins')
    .directive('genomeBrowser', ['$log', 'cttvAPIservice', function ($log, cttvAPIservice) {
        'use strict';

        return {
            restrict: 'E',
            template: '<p class=cttv-section-intro>Genomic variants associated with {{target.symbol}}. Only variants information associating {{target.symbol}} with any disease are displayed. Click on any variant, gene or transcript to get more information about it. Pan or zoom the browser to see neighboring genes. The number above gene variants means that more than 1 overlap the same region at the current zoom level.</p>'
            + '<p>ID: <a target=_blank href="http://www.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g={{target.ensembl_gene_id}}">{{target.ensembl_gene_id}}</a></p>'
            + '<p>Description: {{target.ensembl_description}}</p>'
            + '<p>Gene Location: <a target=_blank href="http://www.ensembl.org/Homo_sapiens/Location/View?db=core;g={{target.ensembl_gene_id}}">Human {{target.chromosome}}:{{target.gene_start}}-{{target.gene_end}}</a></p>',
            scope: {
                target: '=',
                disease: '=',
                width: "="
            },
            link: function (scope, element, attrs) {
                var efo = scope.disease ? scope.disease.id : undefined;
                var w = scope.width - 40;
                var newDiv = document.createElement("div");
                newDiv.id = "targetGenomeBrowser";
                newDiv.className = "accordionCell";
                element[0].appendChild(newDiv);

                var gB = tnt.board.genome()
                    .species("human")
                    .gene(scope.target.id)
                    .context(20)
                    .width(w);

                gB.rest().prefix("/proxy/rest.ensembl.org").protocol("").domain("");
                var theme = targetGenomeBrowser()
                    .efo(efo)
                    .cttvRestApi(cttvAPIservice.getSelf());
                theme(gB, newDiv);
            }
        };
    }]);
