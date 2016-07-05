angular.module('plugins')
    .directive('geneOntology', ['$log', function ($log) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/gene-ontology.html',
            scope: {
                target: '='
            },
            link: function (scope, element, attrs) {
                var gosByOntology = {
                    'F' : [],
                    'C' : [],
                    'P' : []
                };

                var gos = _.keys(scope.target.go);
                for (var i=0; i<scope.target.go.length; i++) {
                    var go = scope.target.go[i];
                    var goid = go.id;
                    var ontology = go.value.term.substring(0,1);
                    gosByOntology[ontology].push ({label: go.value.term.substring(2),
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
                scope.goterms = goArr;
            }
        };
    }]);
