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
                    var ProtVista = require('ProtVista');
                    new ProtVista({
                        proxy: "/proxy/",
                        el: "#upfv",
                        uniprotacc: scope.target.uniprot_accessions[0],
                        exclusions: ['seqInfo']
                    });
                }, 0);
            }
        };
    }]);
