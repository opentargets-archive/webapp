angular.module('plugins')
    .directive('targetFeatures', ['$log', '$timeout', function ($log, $timeout) {
        'use strict';

        return {
            restrict: 'E',
            templateUrl: 'plugins/target-features.html',
            scope: {
                target: '='
            },
            link: function (scope, element, attrs) {
                scope.uniprot = {
                    id : scope.target.uniprot_id,
                    subunits : scope.target.uniprot_subunit,
                    locations : scope.target.uniprot_subcellular_location,
                    accessions : scope.target.uniprot_accessions,
                    keywords : scope.target.uniprot_keywords
                };

                $timeout(function () {
                    console.log(document.getElementById("upfv"));
                    var FeatureViewer = require("biojs-vis-proteinfeaturesviewer");
                    var fvInstance = new FeatureViewer({
                        anproxy: "/proxy/",
                        el: "#upfv",
                        uniprotacc: scope.target.uniprot_accessions[0],
                        exclusions: ['seqInfo']
                    });
                }, 0);
            }
        };
    }]);
